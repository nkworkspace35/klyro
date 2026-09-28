const mammoth = require("mammoth")
const XLSX = require("xlsx")

const MAX_FILE_SIZE = 15 * 1024 * 1024
const MAX_TEXT_LENGTH = 18000

const IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]

const DOCUMENT_TYPES = [
  "application/pdf",

  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "text/plain",
  "text/markdown",
  "text/csv",

  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  "application/vnd.ms-excel",
]


/*
|--------------------------------------------------------------------------
| Basic text cleanup
|--------------------------------------------------------------------------
*/

function cleanText(text) {

  return String(text || "")
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}


/*
|--------------------------------------------------------------------------
| File extension
|--------------------------------------------------------------------------
*/

function getExtension(filename) {

  const parts =
    String(filename || "")
      .split(".")

  return parts.length > 1
    ? parts.pop().toLowerCase()
    : ""
}


/*
|--------------------------------------------------------------------------
| PDF text extraction
|--------------------------------------------------------------------------
*/

async function extractPdfText(buffer) {

  const {
    getDocumentProxy,
    extractText,
  } = await import("unpdf")


  const pdf =
    await getDocumentProxy(
      new Uint8Array(buffer)
    )


  try {

    const result =
      await extractText(pdf, {
        mergePages: true,
      })


    const extractedText =
      cleanText(result.text)


    return {

      text: extractedText,

      totalPages:
        result.totalPages || 0,

    }

  } finally {

    /*
     * Some versions of unpdf/pdf.js do not expose
     * pdf.destroy(). Therefore check before calling it.
     */

    try {

      if (
        pdf &&
        typeof pdf.destroy === "function"
      ) {

        await pdf.destroy()

      }

    } catch (error) {

      console.warn(
        "PDF cleanup warning:",
        error.message
      )

    }

  }
}


/*
|--------------------------------------------------------------------------
| OCR scanned PDF
|--------------------------------------------------------------------------
|
| Flow:
|
| PDF page
|    ↓
| renderPageAsImage()
|    ↓
| PNG buffer
|    ↓
| Tesseract
|    ↓
| extracted OCR text
|
|--------------------------------------------------------------------------
*/

async function extractPdfWithOCR(
  buffer,
  totalPages
) {

  console.log("")
  console.log("========== PDF OCR START ==========")
  console.log(
    `Pages to process: ${totalPages}`
  )


  /*
   * Import dynamically because the backend
   * is using CommonJS.
   */

  const {
    renderPageAsImage,
  } = await import("unpdf")


  const {
    createWorker,
  } = await import("tesseract.js")


  /*
   * Default language:
   *
   * eng = English
   *
   * You can later use:
   *
   * OCR_LANG=eng+hin
   *
   * inside .env if you want English + Hindi OCR.
   */

  const ocrLanguage =
    process.env.OCR_LANG || "eng"


  console.log(
    `OCR language: ${ocrLanguage}`
  )


  /*
   * Create ONE worker for all pages.
   *
   * Tesseract recommends reusing the same worker
   * when processing multiple images.
   */

  const worker =
    await createWorker(
      ocrLanguage,
      1,
      {
        logger: (message) => {

          if (
            message &&
            message.status ===
              "recognizing text"
          ) {

            const progress =
              Math.round(
                (message.progress || 0) * 100
              )

            console.log(
              `OCR progress: ${progress}%`
            )

          }

        },
      }
    )


  const pageTexts = []


  try {

    /*
     * Safety limit.
     *
     * We do not want an accidentally huge PDF
     * to consume unlimited OCR time.
     */

    const safeTotalPages =
      Math.min(
        Number(totalPages) || 0,
        20
      )


    for (
      let pageNumber = 1;
      pageNumber <= safeTotalPages;
      pageNumber++
    ) {

      console.log("")
      console.log(
        `OCR processing page ${pageNumber}/${safeTotalPages}...`
      )


      /*
       * Render current PDF page as PNG.
       *
       * Passing the raw PDF bytes to renderPageAsImage()
       * lets unpdf create the appropriate PDF proxy.
       */

      const imageBuffer =
        await renderPageAsImage(
          new Uint8Array(buffer),
          pageNumber,
          {
            canvasImport:
              () =>
                import("@napi-rs/canvas"),

            /*
             * 2x scale gives OCR a better resolution
             * than the PDF's basic rendering.
             */

            scale: 2,

            toDataURL: false,
          }
        )


      /*
       * Convert ArrayBuffer into Node Buffer.
       */

      const pngBuffer =
        Buffer.from(imageBuffer)


      console.log(
        `Rendered page ${pageNumber}: ${pngBuffer.length} bytes`
      )


      /*
       * Tesseract reads the rendered image.
       */

      const result =
        await worker.recognize(
          pngBuffer
        )


      const pageText =
        cleanText(
          result?.data?.text || ""
        )


      console.log(
        `Page ${pageNumber} OCR characters: ${pageText.length}`
      )


      if (pageText) {

        pageTexts.push(
          `PAGE ${pageNumber}\n${pageText}`
        )

      }

    }


  } finally {

    /*
     * Always terminate the worker.
     */

    try {

      await worker.terminate()

    } catch (error) {

      console.warn(
        "OCR worker cleanup warning:",
        error.message
      )

    }

  }


  const finalText =
    cleanText(
      pageTexts.join("\n\n")
    )


  console.log("")
  console.log(
    `Total OCR characters: ${finalText.length}`
  )

  console.log("========== PDF OCR END ==========")
  console.log("")


  return finalText
}


/*
|--------------------------------------------------------------------------
| Complete PDF extraction
|--------------------------------------------------------------------------
|
| First:
|   Try normal selectable-text extraction.
|
| If no text:
|   Automatically use OCR.
|
|--------------------------------------------------------------------------
*/

async function extractPdf(
  buffer
) {

  /*
   * First attempt:
   * normal PDF text extraction.
   */

  const normalExtraction =
    await extractPdfText(buffer)


  const normalText =
    cleanText(
      normalExtraction.text
    )


  console.log("")
  console.log(
    `PDF normal text extraction: ${normalText.length} characters`
  )


  /*
   * If normal extraction worked,
   * there is no need to run OCR.
   */

  if (normalText) {

    console.log(
      "Selectable PDF text found. OCR not required."
    )


    return {

      text: normalText,

      totalPages:
        normalExtraction.totalPages || 0,

      extractionMethod:
        "pdf-text",

      ocrUsed: false,

    }

  }


  /*
   * No selectable text.
   *
   * This is probably a scanned/image-based PDF.
   */

  console.log(
    "No selectable PDF text found."
  )

  console.log(
    "Trying OCR fallback..."
  )


  const ocrText =
    await extractPdfWithOCR(
      buffer,
      normalExtraction.totalPages
    )


  return {

    text: cleanText(ocrText),

    totalPages:
      normalExtraction.totalPages || 0,

    extractionMethod:
      ocrText
        ? "ocr"
        : "none",

    ocrUsed: true,

  }
}


/*
|--------------------------------------------------------------------------
| Generic document extraction
|--------------------------------------------------------------------------
*/

async function extractDocument(file) {

  const extension =
    getExtension(
      file.originalname
    )


  /*
   * PDF
   */

  if (
    file.mimetype === "application/pdf" ||
    extension === "pdf"
  ) {

    return extractPdf(
      file.buffer
    )

  }


  /*
   * DOCX
   */

  if (
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === "docx"
  ) {

    const result =
      await mammoth.extractRawText({
        buffer: file.buffer,
      })


    return {

      text:
        cleanText(
          result.value
        ),

      totalPages: null,

      extractionMethod:
        "docx-text",

      ocrUsed: false,

    }

  }


  /*
   * TXT
   */

  if (
    file.mimetype === "text/plain" ||
    extension === "txt"
  ) {

    return {

      text:
        cleanText(
          file.buffer.toString("utf8")
        ),

      totalPages: null,

      extractionMethod:
        "plain-text",

      ocrUsed: false,

    }

  }


  /*
   * Markdown
   */

  if (
    file.mimetype === "text/markdown" ||
    extension === "md"
  ) {

    return {

      text:
        cleanText(
          file.buffer.toString("utf8")
        ),

      totalPages: null,

      extractionMethod:
        "markdown",

      ocrUsed: false,

    }

  }


  /*
   * CSV
   */

  if (
    file.mimetype === "text/csv" ||
    extension === "csv"
  ) {

    return {

      text:
        cleanText(
          file.buffer.toString("utf8")
        ),

      totalPages: null,

      extractionMethod:
        "csv",

      ocrUsed: false,

    }

  }


  /*
   * Excel
   */

  if (
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||

    file.mimetype ===
      "application/vnd.ms-excel" ||

    extension === "xlsx" ||

    extension === "xls"
  ) {

    const workbook =
      XLSX.read(
        file.buffer,
        {
          type: "buffer",
        }
      )


    const sheetTexts = []


    for (
      const sheetName
      of workbook.SheetNames
    ) {

      const sheet =
        workbook.Sheets[
          sheetName
        ]


      const csv =
        XLSX.utils.sheet_to_csv(
          sheet,
          {
            blankrows: false,
          }
        )


      sheetTexts.push(
        `SHEET: ${sheetName}\n${csv}`
      )

    }


    return {

      text:
        cleanText(
          sheetTexts.join("\n\n")
        ),

      totalPages: null,

      extractionMethod:
        "spreadsheet",

      ocrUsed: false,

    }

  }


  throw new Error(
    "Unsupported document format."
  )
}


/*
|--------------------------------------------------------------------------
| Upload controller
|--------------------------------------------------------------------------
*/

async function uploadFile(
  req,
  res
) {

  try {

    /*
     * No file
     */

    if (!req.file) {

      return res.status(400).json({

        success: false,

        message:
          "Please select a file.",

      })

    }


    const file =
      req.file


    /*
     * File size check
     */

    if (
      file.size >
      MAX_FILE_SIZE
    ) {

      return res.status(413).json({

        success: false,

        message:
          "File is too large. Maximum allowed size is 15MB.",

      })

    }


    const extension =
      getExtension(
        file.originalname
      )


    /*
     * Image detection
     */

    const isImage =
      IMAGE_TYPES.includes(
        file.mimetype
      ) ||
      [
        "png",
        "jpg",
        "jpeg",
        "webp",
      ].includes(extension)


    /*
     * Document detection
     */

    const isDocument =
      DOCUMENT_TYPES.includes(
        file.mimetype
      ) ||
      [
        "pdf",
        "docx",
        "txt",
        "md",
        "csv",
        "xlsx",
        "xls",
      ].includes(extension)


    /*
     * Unsupported file
     */

    if (
      !isImage &&
      !isDocument
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Unsupported file. Use PDF, DOCX, TXT, MD, CSV, XLSX, XLS, PNG, JPG or WEBP.",

      })

    }


    /*
     |--------------------------------------------------------------------------
     | IMAGE
     |--------------------------------------------------------------------------
     */

    if (isImage) {

      const base64 =
        file.buffer.toString(
          "base64"
        )


      const dataUrl =
        `data:${file.mimetype};base64,${base64}`


      console.log("")
      console.log(
        "========== IMAGE PROCESSED =========="
      )

      console.log(
        `File: ${file.originalname}`
      )

      console.log(
        `Type: ${file.mimetype}`
      )

      console.log(
        `Size: ${file.size}`
      )

      console.log(
        "======================================"
      )


      return res.json({

        success: true,

        file: {

          name:
            file.originalname,

          type:
            file.mimetype,

          size:
            file.size,

          kind:
            "image",

          text:
            "",

          dataUrl,

        },

      })

    }


    /*
     |--------------------------------------------------------------------------
     | DOCUMENT
     |--------------------------------------------------------------------------
     */

    const extracted =
      await extractDocument(
        file
      )


    let text =
      extracted.text || ""


    /*
     * Maximum text limit.
     */

    let truncated =
      false


    if (
      text.length >
      MAX_TEXT_LENGTH
    ) {

      text =
        text.slice(
          0,
          MAX_TEXT_LENGTH
        ) +
        "\n\n[Document text truncated for faster AI processing.]"


      truncated = true

    }


    /*
     |--------------------------------------------------------------------------
     | Diagnostic logs
     |--------------------------------------------------------------------------
     */

    console.log("")
    console.log(
      "========== FILE PROCESSED =========="
    )

    console.log(
      `File: ${file.originalname}`
    )

    console.log(
      `Type: ${file.mimetype}`
    )

    console.log(
      `Size: ${file.size}`
    )

    console.log(
      `Extension: ${extension}`
    )

    console.log(
      `Pages: ${extracted.totalPages || "N/A"}`
    )

    console.log(
      `Extraction method: ${extracted.extractionMethod || "unknown"}`
    )

    console.log(
      `OCR used: ${Boolean(extracted.ocrUsed)}`
    )

    console.log(
      `Extracted characters: ${text.length}`
    )

    console.log(
      `Has text: ${Boolean(text.trim())}`
    )

    console.log(
      `Truncated: ${truncated}`
    )


    if (!text.trim()) {

      console.warn(
        "WARNING: No readable text found in document."
      )

    }


    console.log(
      "===================================="
    )

    console.log("")


    /*
     |--------------------------------------------------------------------------
     | Return file information to frontend
     |--------------------------------------------------------------------------
     */

    return res.json({

      success: true,

      file: {

        name:
          file.originalname,

        type:
          file.mimetype,

        size:
          file.size,

        kind:
          "document",

        text,

        totalPages:
          extracted.totalPages || null,

        dataUrl:
          null,

        /*
         * Extra diagnostic information.
         */

        extractionMethod:
          extracted.extractionMethod ||
          "unknown",

        ocrUsed:
          Boolean(
            extracted.ocrUsed
          ),

        textExtracted:
          Boolean(
            text.trim()
          ),

        truncated,

      },

    })

  } catch (error) {

    console.error("")
    console.error(
      "========== FILE UPLOAD ERROR =========="
    )

    console.error(
      error
    )

    console.error(
      "========================================"
    )


    return res.status(500).json({

      success: false,

      message:
        "The file could not be processed.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,

    })

  }

}


/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {

  uploadFile,

}