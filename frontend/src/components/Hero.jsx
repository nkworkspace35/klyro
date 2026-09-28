import {
  useEffect,
  useRef,
  useState,
} from "react"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"


const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"


/*
==========================================================
KLYRO MODELS
==========================================================
*/

const MODELS = [
  {
    id: "openai/gpt-oss-20b",
    name: "GPT-OSS 20B",
    description:
      "Fast general questions, coding and math",
  },

  {
    id: "openai/gpt-oss-120b",
    name: "GPT-OSS 120B",
    description:
      "Advanced reasoning, coding and math",
  },

  {
    id: "qwen/qwen3.8-27b",
    name: "Qwen 3.8 27B",
    description:
      "Multilingual and image understanding",
  },
]


/*
==========================================================
HELPERS
==========================================================
*/

function createId() {
  return (
    Date.now().toString() +
    Math.random()
      .toString(36)
      .slice(2)
  )
}


/*
==========================================================
TOKEN HELPER
==========================================================
*/

function normalizeToken(value) {

  if (!value) {
    return ""
  }


  let token =
    value


  if (
    typeof token === "string" &&
    token.trim().startsWith("{")
  ) {

    try {

      const parsed =
        JSON.parse(token)


      token =
        parsed?.token ||
        parsed?.accessToken ||
        parsed?.access_token ||
        ""

    } catch (error) {}
  }


  if (
    typeof token !== "string"
  ) {
    return ""
  }


  token =
    token.trim()


  if (
    token
      .toLowerCase()
      .startsWith("bearer ")
  ) {

    token =
      token
        .slice(7)
        .trim()
  }


  return token
}


function getToken() {

  const preferredKeys = [
    "klyro_token",
    "token",
    "authToken",
    "accessToken",
    "access_token",
    "jwt",
  ]


  /*
  --------------------------------------------------------
  localStorage
  --------------------------------------------------------
  */

  for (
    const key
    of preferredKeys
  ) {

    const value =
      localStorage.getItem(
        key
      )


    const token =
      normalizeToken(
        value
      )


    if (token) {
      return token
    }
  }


  /*
  --------------------------------------------------------
  sessionStorage
  --------------------------------------------------------
  */

  for (
    const key
    of preferredKeys
  ) {

    const value =
      sessionStorage.getItem(
        key
      )


    const token =
      normalizeToken(
        value
      )


    if (token) {
      return token
    }
  }


  /*
  --------------------------------------------------------
  JWT fallback scan
  --------------------------------------------------------
  */

  try {

    for (
      let i = 0;
      i < localStorage.length;
      i++
    ) {

      const key =
        localStorage.key(i)


      if (!key) {
        continue
      }


      const value =
        localStorage.getItem(
          key
        )


      const token =
        normalizeToken(
          value
        )


      if (
        token &&
        /^eyJ[A-Za-z0-9_-]+\./.test(
          token
        )
      ) {

        return token
      }
    }

  } catch (error) {

    console.warn(
      "Token storage scan failed:",
      error
    )
  }


  return ""
}


/*
==========================================================
IMAGE COMPRESSION
==========================================================

This only prepares the image before the actual upload.

IMPORTANT:
It does NOT upload anything.

The backend upload will happen only after
the user presses Send.
==========================================================
*/

function compressImage(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader()


      reader.onload = () => {

        const image =
          new Image()


        image.onload = () => {

          const maxSize =
            1600


          let width =
            image.width


          let height =
            image.height


          if (
            width > maxSize ||
            height > maxSize
          ) {

            const ratio =
              Math.min(
                maxSize / width,
                maxSize / height
              )


            width =
              Math.round(
                width * ratio
              )


            height =
              Math.round(
                height * ratio
              )
          }


          const canvas =
            document.createElement(
              "canvas"
            )


          canvas.width =
            width


          canvas.height =
            height


          const ctx =
            canvas.getContext(
              "2d"
            )


          if (!ctx) {

            reject(
              new Error(
                "Image processing is unavailable."
              )
            )

            return
          }


          ctx.drawImage(
            image,
            0,
            0,
            width,
            height
          )


          canvas.toBlob(
            (blob) => {

              if (!blob) {

                reject(
                  new Error(
                    "Image compression failed."
                  )
                )

                return
              }


              const compressed =
                new File(
                  [blob],
                  file.name,
                  {
                    type:
                      "image/jpeg",

                    lastModified:
                      Date.now(),
                  }
                )


              resolve(
                compressed
              )

            },
            "image/jpeg",
            0.82
          )
        }


        image.onerror = () => {

          reject(
            new Error(
              "Image could not be read."
            )
          )
        }


        image.src =
          reader.result
      }


      reader.onerror = () => {

        reject(
          new Error(
            "Image could not be loaded."
          )
        )
      }


      reader.readAsDataURL(
        file
      )
    }
  )
}


/*
==========================================================
HERO
==========================================================
*/

export default function Hero() {

  /*
  ========================================================
  MESSAGES
  ========================================================
  */

  const [
    messages,
    setMessages,
  ] = useState([])


  /*
  ========================================================
  INPUT
  ========================================================
  */

  const [
    input,
    setInput,
  ] = useState("")


  /*
  ========================================================
  GENERATION STATE

  idle
  generating
  paused
  ========================================================
  */

  const [
    generationState,
    setGenerationState,
  ] = useState("idle")


  /*
  ========================================================
  UPLOAD / FILE PROCESSING STATE
  ========================================================

  IMPORTANT:

  This does NOT start when a file is selected.

  It only becomes true after Send is clicked.
  ========================================================
  */

  const [
    uploading,
    setUploading,
  ] = useState(false)


  /*
  ========================================================
  ATTACHMENTS
  ========================================================

  These are now STAGED attachments.

  When user selects a file:

      File object stays here.

  No API call happens.

  On Send:

      staged File
          ↓
      /api/upload
          ↓
      processed attachment
  ========================================================
  */

  const [
    attachments,
    setAttachments,
  ] = useState([])


  /*
  ========================================================
  SELECTED MODEL
  ========================================================
  */

  const [
    selectedModel,
    setSelectedModel,
  ] = useState(() => {

    const saved =
      localStorage.getItem(
        "klyro_model"
      )


    const valid =
      MODELS.some(
        (model) =>
          model.id === saved
      )


    return valid
      ? saved
      : "openai/gpt-oss-20b"
  })


  /*
  ========================================================
  COPY STATE
  ========================================================
  */

  const [
    copiedMessageId,
    setCopiedMessageId,
  ] = useState(null)


  /*
  ========================================================
  REFS
  ========================================================
  */

  const chatContainerRef =
    useRef(null)


  const textareaRef =
    useRef(null)


  const fileInputRef =
    useRef(null)


  const activeGenerationRef =
    useRef(null)


  const shouldAutoScrollRef =
    useRef(true)


  const streamRenderTimerRef =
    useRef(null)


  /*
  ========================================================
  SAVE MODEL
  ========================================================
  */

  useEffect(() => {

    localStorage.setItem(
      "klyro_model",
      selectedModel
    )

  }, [selectedModel])


  /*
  ========================================================
  CLEANUP
  ========================================================
  */

  useEffect(() => {

    return () => {

      if (
        streamRenderTimerRef.current
      ) {

        clearTimeout(
          streamRenderTimerRef.current
        )

        streamRenderTimerRef.current =
          null
      }


      const active =
        activeGenerationRef.current


      if (active) {

        try {

          active.reader?.cancel()

        } catch (error) {}


        try {

          active.controller?.abort()

        } catch (error) {}
      }
    }

  }, [])


  /*
  ========================================================
  INTERNAL AUTO SCROLL
  ========================================================
  */

  useEffect(() => {

    const container =
      chatContainerRef.current


    if (
      !container ||
      !shouldAutoScrollRef.current
    ) {
      return
    }


    container.scrollTop =
      container.scrollHeight

  }, [messages])


  /*
  ========================================================
  CHAT SCROLL
  ========================================================
  */

  function handleScroll() {

    const container =
      chatContainerRef.current


    if (!container) {
      return
    }


    const distance =
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight


    shouldAutoScrollRef.current =
      distance < 100
  }


  function scrollToBottom() {

    const container =
      chatContainerRef.current


    if (!container) {
      return
    }


    shouldAutoScrollRef.current =
      true


    container.scrollTop =
      container.scrollHeight
  }


  /*
  ========================================================
  FOCUS INPUT
  ========================================================
  */

  function focusInput() {

    setTimeout(() => {

      textareaRef.current?.focus()

    }, 50)
  }


  /*
  ========================================================
  UPDATE ASSISTANT
  ========================================================
  */

  function updateAssistant(
    assistantId,
    updater
  ) {

    setMessages(
      (prev) =>
        prev.map(
          (item) => {

            if (
              item.id !==
              assistantId
            ) {

              return item
            }


            const updated =
              updater(item)


            return {
              ...item,
              ...updated,
            }
          }
        )
    )
  }


  /*
  ========================================================
  PROCESS ONE ATTACHMENT
  ========================================================

  THIS IS THE IMPORTANT CHANGE.

  This function is called ONLY after Send.

  It uploads the selected file to:

      /api/upload

  Then returns the processed file object.

  PDF:
      backend OCR/extraction happens here.

  Image:
      backend image processing happens here.

  DOCX/TXT/etc:
      backend text extraction happens here.
  ========================================================
  */

  async function processAttachment(
    attachment
  ) {

    if (!attachment?.file) {

      throw new Error(
        `Invalid attachment: ${
          attachment?.name ||
          "unknown file"
        }`
      )
    }


    const file =
      attachment.file


    if (
      file.size >
      15 * 1024 * 1024
    ) {

      throw new Error(
        `${file.name} is larger than 15MB.`
      )
    }


    let uploadObject =
      file


    /*
    --------------------------------------------------------
    IMAGE COMPRESSION

    This still happens only during Send.

    Selecting an image does NOT compress/upload it.
    --------------------------------------------------------
    */

    if (
      file.type.startsWith(
        "image/"
      )
    ) {

      uploadObject =
        await compressImage(
          file
        )
    }


    const formData =
      new FormData()


    formData.append(
      "file",
      uploadObject
    )


    const token =
      getToken()


    if (!token) {

      throw new Error(
        "Please login first."
      )
    }


    const response =
      await fetch(
        `${API_URL}/api/upload`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body:
            formData,
        }
      )


    let data = null


    try {

      data =
        await response.json()

    } catch (error) {

      throw new Error(
        "Server returned an invalid file response."
      )
    }


    if (!response.ok) {

      throw new Error(
        data?.message ||
        `Failed to process ${file.name}.`
      )
    }


    if (
      !data?.success ||
      !data?.file
    ) {

      throw new Error(
        `Invalid response for ${file.name}.`
      )
    }


    /*
    --------------------------------------------------------
    IMPORTANT

    Preserve the original file name.

    Backend may change MIME/type after processing,
    especially for compressed images.
    --------------------------------------------------------
    */

    return {
      ...data.file,

      name:
        data.file.name ||
        file.name,

      originalName:
        file.name,

      originalType:
        file.type,
    }
  }


  /*
  ========================================================
  PROCESS ALL ATTACHMENTS
  ========================================================

  Called ONLY when user clicks Send.

  Example:

      PDF
      DOCX
      Image

  will be processed one by one.

  The resulting objects are then sent to /api/chat.
  ========================================================
  */

  async function processPendingAttachments(
    pendingAttachments
  ) {

    if (
      !Array.isArray(
        pendingAttachments
      ) ||
      !pendingAttachments.length
    ) {

      return []
    }


    setUploading(true)


    try {

      const processedFiles = []


      for (
        const attachment
        of pendingAttachments
      ) {

        /*
        Stop if the attachment was somehow
        removed before processing.
        */

        if (
          !attachment?.file
        ) {
          continue
        }


        const processed =
          await processAttachment(
            attachment
          )


        processedFiles.push(
          processed
        )
      }


      return processedFiles

    } finally {

      setUploading(false)
    }
  }


  /*
  ========================================================
  FILE CHANGE
  ========================================================

  IMPORTANT CHANGE:

  BEFORE:

      selecting file
          ↓
      uploadFile()
          ↓
      backend immediately

  NOW:

      selecting file
          ↓
      store File object locally
          ↓
      show attachment chip
          ↓
      WAIT

  Nothing goes to backend here.
  ========================================================
  */

  function handleFileChange(event) {

    const files =
      Array.from(
        event.target.files || []
      )


    /*
    Reset input so the same file can be selected
    again later.
    */

    event.target.value = ""


    if (!files.length) {
      return
    }


    /*
    Maximum 3 attachments TOTAL.
    */

    const availableSlots =
      3 -
      attachments.length


    if (
      availableSlots <= 0
    ) {

      alert(
        "You can attach maximum 3 files."
      )

      return
    }


    if (
      files.length >
      availableSlots
    ) {

      alert(
        `You can attach maximum 3 files. Only ${availableSlots} more file${
          availableSlots === 1
            ? ""
            : "s"
        } can be added.`
      )
    }


    const selectedFiles =
      files.slice(
        0,
        availableSlots
      )


    /*
    --------------------------------------------------------
    Validate files locally.
    --------------------------------------------------------
    */

    const validFiles =
      selectedFiles.filter(
        (file) => {

          if (
            file.size >
            15 * 1024 * 1024
          ) {

            alert(
              `${file.name} is larger than 15MB.`
            )

            return false
          }


          return true
        }
      )


    /*
    --------------------------------------------------------
    Create STAGED attachment objects.

    The actual File object is kept.

    No backend call.
    --------------------------------------------------------
    */

    const stagedFiles =
      validFiles.map(
        (file) => ({

          id:
            createId(),

          name:
            file.name,

          type:
            file.type,

          size:
            file.size,

          kind:
            file.type.startsWith(
              "image/"
            )
              ? "image"
              : "document",

          file,

          status:
            "pending",

          text:
            "",

          dataUrl:
            null,
        })
      )


    setAttachments(
      (prev) =>
        [
          ...prev,
          ...stagedFiles,
        ].slice(-3)
    )


    /*
    Keep typing focus.
    */

    focusInput()
  }


  /*
  ========================================================
  REMOVE ATTACHMENT
  ========================================================
  */

  function removeAttachment(index) {

    /*
    Do not allow removal while backend is
    currently processing the files.
    */

    if (uploading) {
      return
    }


    setAttachments(
      (prev) =>
        prev.filter(
          (_, i) =>
            i !== index
        )
    )
  }


  /*
  ========================================================
  SSE EVENT PARSER
  ========================================================
  */

  function parseSSEEvent(
    eventText
  ) {

    const lines =
      eventText.split("\n")


    let eventName =
      "message"


    const dataLines = []


    for (
      const line
      of lines
    ) {

      if (
        line.startsWith(
          "event:"
        )
      ) {

        eventName =
          line
            .slice(6)
            .trim()

        continue
      }


      if (
        line.startsWith(
          "data:"
        )
      ) {

        dataLines.push(
          line
            .slice(5)
            .trimStart()
        )
      }
    }


    if (!dataLines.length) {

      return {
        eventName,
        eventData: null,
      }
    }


    const rawData =
      dataLines.join("\n")


    if (!rawData.trim()) {

      return {
        eventName,
        eventData: null,
      }
    }


    try {

      return {
        eventName,

        eventData:
          JSON.parse(
            rawData
          ),
      }

    } catch (error) {

      console.warn(
        "SSE JSON parse warning:",
        rawData
      )


      return {
        eventName,
        eventData: null,
      }
    }
  }


  /*
  ========================================================
  SEND AI REQUEST
  ========================================================
  */

  async function sendToAI({
    userText,
    userMessageId,
    assistantMessageId,
    requestAttachments,
    excludeMessageIds = [],
  }) {

    const token =
      getToken()


    if (!token) {

      throw new Error(
        "Please login first."
      )
    }


    const controller =
      new AbortController()


    setGenerationState(
      "generating"
    )


    activeGenerationRef.current = {
      controller,

      reader: null,

      assistantMessageId,

      userMessageId,
    }


    let streamedText = ""

    let lastRenderedText = ""

    let receivedDone = false

    /*
    IMPORTANT

    This becomes true when the AI response
    is actually complete.

    It prevents the UI from getting stuck
    on the Pause button.
    */

    let responseCompleted = false


    try {

      /*
      ====================================================
      HISTORY
      ====================================================
      */

      const excludedIds =
        new Set(
          excludeMessageIds
        )


      const history =
        messages
          .filter(
            (item) =>
              !excludedIds.has(
                item.id
              )
          )
          .filter(
            (item) =>
              item.id !==
              assistantMessageId
          )
          .filter(
            (item) =>
              item.role === "user" ||
              item.role === "assistant"
          )
          .slice(-12)
          .map(
            (item) => ({

              role:
                item.role ===
                "assistant"
                  ? "assistant"
                  : "user",

              content:
                item.content ||
                "",
            })
          )


      /*
      ====================================================
      ATTACHMENTS
      ====================================================

      At this point the files MUST already have been
      processed by /api/upload.

      Therefore only processed file information
      is sent to /api/chat.
      ====================================================
      */

      const cleanAttachments =
        Array.isArray(
          requestAttachments
        )
          ? requestAttachments.map(
              (file) => ({

                name:
                  file.name ||
                  file.originalName ||
                  "",

                type:
                  file.type ||
                  file.originalType ||
                  "",

                kind:
                  file.kind ||
                  "",

                text:
                  file.text ||
                  "",

                dataUrl:
                  file.dataUrl ||
                  null,
              })
            )
          : []


      /*
      ====================================================
      FAST MODE
      ====================================================
      */

      const fastMode =
        selectedModel ===
        "openai/gpt-oss-20b"


      /*
      ====================================================
      REQUEST
      ====================================================
      */

      const response =
        await fetch(
          `${API_URL}/api/chat`,
          {
            method: "POST",

            headers: {

              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({

                message:
                  userText,

                history,

                model:
                  selectedModel,

                fastMode,

                attachments:
                  cleanAttachments,
              }),

            signal:
              controller.signal,
          }
        )


      /*
      ====================================================
      HTTP ERROR
      ====================================================
      */

      if (!response.ok) {

        let errorMessage =
          "KLYRO could not answer."


        try {

          const contentType =
            response.headers.get(
              "content-type"
            ) || ""


          if (
            contentType.includes(
              "application/json"
            )
          ) {

            const errorData =
              await response.json()


            errorMessage =
              errorData?.message ||
              errorMessage

          } else {

            const text =
              await response.text()


            if (text) {
              errorMessage =
                text
            }
          }

        } catch (error) {}


        throw new Error(
          errorMessage
        )
      }


      /*
      ====================================================
      CONTENT TYPE
      ====================================================
      */

      const contentType =
        response.headers.get(
          "content-type"
        ) || ""


      /*
      ====================================================
      NON STREAM RESPONSE
      ====================================================
      */

      if (
        !contentType.includes(
          "text/event-stream"
        )
      ) {

        const data =
          await response.json()


        const text =
          data?.text ||
          data?.message ||
          ""


        if (text) {

          updateAssistant(
            assistantMessageId,
            () => ({

              content:
                text,

              status:
                "completed",
            })
          )

        } else {

          updateAssistant(
            assistantMessageId,
            (item) => ({

              status:
                item.content
                  ? "completed"
                  : "error",

              content:
                item.content ||
                "",
            })
          )
        }


        responseCompleted =
          true


        const active =
          activeGenerationRef.current


        if (
          active &&
          active.assistantMessageId ===
            assistantMessageId
        ) {

          activeGenerationRef.current =
            null
        }


        setGenerationState(
          "idle"
        )


        focusInput()


        return
      }


      /*
      ====================================================
      STREAM CHECK
      ====================================================
      */

      if (!response.body) {

        throw new Error(
          "AI stream is unavailable."
        )
      }


      const reader =
        response.body.getReader()


      if (
        activeGenerationRef.current &&
        activeGenerationRef.current
          .assistantMessageId ===
          assistantMessageId
      ) {

        activeGenerationRef.current.reader =
          reader
      }


      const decoder =
        new TextDecoder(
          "utf-8"
        )


      let buffer = ""


      /*
      ====================================================
      RENDER STREAMED TEXT
      ====================================================
      */

      function renderStreamText(
        force = false
      ) {

        if (
          !force &&
          streamedText ===
            lastRenderedText
        ) {
          return
        }


        const render =
          () => {

            if (
              controller.signal.aborted
            ) {
              return
            }


            lastRenderedText =
              streamedText


            updateAssistant(
              assistantMessageId,
              () => ({

                content:
                  streamedText,

                status:
                  "streaming",
              })
            )
          }


        if (force) {

          if (
            streamRenderTimerRef.current
          ) {

            clearTimeout(
              streamRenderTimerRef.current
            )


            streamRenderTimerRef.current =
              null
          }


          render()

          return
        }


        if (
          streamRenderTimerRef.current
        ) {
          return
        }


        streamRenderTimerRef.current =
          setTimeout(() => {

            streamRenderTimerRef.current =
              null

            render()

          }, 35)
      }


      /*
      ====================================================
      PROCESS SSE EVENT
      ====================================================
      */

      const processEvent =
        (eventText) => {

          if (
            !eventText.trim()
          ) {
            return
          }


          if (
            controller.signal.aborted
          ) {
            return
          }


          const {
            eventName,
            eventData,
          } =
            parseSSEEvent(
              eventText
            )


          if (!eventData) {
            return
          }


          /*
          ------------------------------------------------
          META
          ------------------------------------------------
          */

          if (
            eventName ===
            "meta"
          ) {

            return
          }


          /*
          ------------------------------------------------
          CHUNK
          ------------------------------------------------
          */

          if (
            eventName ===
            "chunk"
          ) {

            const chunk =
              eventData.text ||
              ""


            if (!chunk) {
              return
            }


            streamedText +=
              chunk


            renderStreamText()


            return
          }


          /*
          ------------------------------------------------
          FINAL
          ------------------------------------------------

          IMPORTANT:

          The final event means the actual
          AI answer has completed.

          Therefore:

          Pause -> Send
          Regenerate -> enabled
          ------------------------------------------------
          */

          if (
            eventName ===
            "final"
          ) {

            const finalText =
              eventData.text ||
              ""


            if (finalText) {

              streamedText =
                finalText


              renderStreamText(
                true
              )
            }


            /*
            Mark response complete.
            */

            responseCompleted =
              true


            /*
            Update assistant message.
            */

            updateAssistant(
              assistantMessageId,
              (item) => ({

                status:
                  "completed",

                content:
                  item.content ||
                  streamedText ||
                  "",
              })
            )


            /*
            IMPORTANT:

            Clear active generation immediately.

            This makes the UI return to
            Send state without waiting for
            another event.
            */

            const active =
              activeGenerationRef.current


            if (
              active &&
              active.assistantMessageId ===
                assistantMessageId
            ) {

              activeGenerationRef.current =
                null
            }


            /*
            Pause -> Send
            */

            setGenerationState(
              "idle"
            )


            /*
            Focus input.
            */

            focusInput()


            /*
            We do not immediately cancel
            the reader here.

            The backend may still send
            the final done event.
            */

            return
          }


          /*
          ------------------------------------------------
          ERROR
          ------------------------------------------------
          */

          if (
            eventName ===
            "error"
          ) {

            throw new Error(
              eventData.message ||
              "AI response failed."
            )
          }


          /*
          ------------------------------------------------
          DONE
          ------------------------------------------------
          */

          if (
            eventName ===
            "done"
          ) {

            receivedDone =
              true


            /*
            If final already completed
            the response, don't process
            completion twice.
            */

            if (
              responseCompleted
            ) {

              return
            }


            if (
              eventData.success ===
              false
            ) {

              updateAssistant(
                assistantMessageId,
                (item) => ({

                  status:
                    "error",

                  content:
                    item.content ||
                    "KLYRO could not complete the response.",
                })
              )


              responseCompleted =
                true

            } else {

              renderStreamText(
                true
              )


              updateAssistant(
                assistantMessageId,
                (item) => ({

                  status:
                    "completed",

                  content:
                    item.content ||
                    streamedText ||
                    "",
                })
              )


              responseCompleted =
                true
            }


            /*
            Clear active generation.
            */

            const active =
              activeGenerationRef.current


            if (
              active &&
              active.assistantMessageId ===
                assistantMessageId
            ) {

              activeGenerationRef.current =
                null
            }


            /*
            Pause -> Send
            */

            setGenerationState(
              "idle"
            )


            focusInput()
          }
        }


      /*
      ====================================================
      READ STREAM
      ====================================================
      */

      while (true) {

        if (
          controller.signal.aborted
        ) {
          break
        }


        const {
          value,
          done,
        } =
          await reader.read()


        if (done) {
          break
        }


        if (value) {

          buffer +=
            decoder.decode(
              value,
              {
                stream:
                  true,
              }
            )
        }


        /*
        Normalize Windows line endings.
        */

        buffer =
          buffer.replace(
            /\r\n/g,
            "\n"
          )


        let separatorIndex =
          buffer.indexOf(
            "\n\n"
          )


        while (
          separatorIndex !== -1
        ) {

          const eventText =
            buffer.slice(
              0,
              separatorIndex
            )


          buffer =
            buffer.slice(
              separatorIndex + 2
            )


          processEvent(
            eventText
          )


          if (
            controller.signal.aborted
          ) {
            break
          }


          separatorIndex =
            buffer.indexOf(
              "\n\n"
            )
        }


        if (
          controller.signal.aborted
        ) {
          break
        }
      }


      /*
      ====================================================
      FLUSH DECODER
      ====================================================
      */

      if (
        !controller.signal.aborted
      ) {

        buffer +=
          decoder.decode()


        buffer =
          buffer.replace(
            /\r\n/g,
            "\n"
          )


        if (
          buffer.trim()
        ) {

          processEvent(
            buffer
          )
        }
      }


      /*
      ====================================================
      FINAL RENDER
      ====================================================
      */

      if (
        !controller.signal.aborted
      ) {

        renderStreamText(
          true
        )
      }


      /*
      ====================================================
      PAUSED / ABORTED
      ====================================================
      */

      if (
        controller.signal.aborted
      ) {

        return
      }


      /*
      ====================================================
      STREAM ENDED WITHOUT DONE
      ====================================================
      */

      if (
        !receivedDone &&
        !responseCompleted
      ) {

        if (
          streamedText
        ) {

          updateAssistant(
            assistantMessageId,
            (item) => ({

              status:
                "completed",

              content:
                item.content ||
                streamedText ||
                "",
            })
          )


          responseCompleted =
            true

        } else {

          updateAssistant(
            assistantMessageId,
            (item) => ({

              status:
                "error",

              content:
                item.content ||
                "",
            })
          )
        }


        /*
        Make sure Pause changes
        to Send even if backend
        did not send DONE.
        */

        const active =
          activeGenerationRef.current


        if (
          active &&
          active.assistantMessageId ===
            assistantMessageId
        ) {

          activeGenerationRef.current =
            null
        }


        setGenerationState(
          "idle"
        )


        focusInput()
      }

    } catch (error) {

      /*
      ====================================================
      ABORT / PAUSE
      ====================================================
      */

      if (
        error?.name ===
        "AbortError"
      ) {

        return
      }


      if (
        controller.signal.aborted
      ) {

        return
      }


      /*
      ====================================================
      REAL ERROR
      ====================================================
      */

      console.error(
        "KLYRO CHAT ERROR:",
        error
      )


      updateAssistant(
        assistantMessageId,
        (item) => ({

          status:
            "error",

          content:
            item.content ||
            streamedText ||
            "",
        })
      )


      if (
        !streamedText
      ) {

        updateAssistant(
          assistantMessageId,
          () => ({

            status:
              "error",

            content:
              `Sorry, ${
                error?.message ||
                "something went wrong."
              }`,
          })
        )
      }


      responseCompleted =
        true

    } finally {

      /*
      ====================================================
      CLEAR STREAM TIMER
      ====================================================
      */

      if (
        streamRenderTimerRef.current
      ) {

        clearTimeout(
          streamRenderTimerRef.current
        )


        streamRenderTimerRef.current =
          null
      }


      /*
      ====================================================
      ACTIVE GENERATION CLEANUP
      ====================================================
      */

      const active =
        activeGenerationRef.current


      if (
        active &&
        active.assistantMessageId ===
          assistantMessageId
      ) {

        activeGenerationRef.current =
          null
      }


      /*
      ====================================================
      FINAL UI STATE

      IMPORTANT:

      If response is completed:
      ALWAYS -> idle

      If manually aborted:
      -> paused

      Otherwise:
      -> idle
      ====================================================
      */

      if (
        responseCompleted
      ) {

        setGenerationState(
          "idle"
        )

      } else if (
        controller.signal.aborted
      ) {

        setGenerationState(
          "paused"
        )

      } else {

        setGenerationState(
          "idle"
        )
      }


      focusInput()
    }
  }


  /*
  ========================================================
  SEND MESSAGE
  ========================================================

  NEW FLOW:

  1. Get question.
  2. Get staged files.
  3. Show user message.
  4. Process/upload files NOW.
  5. Send processed file data to AI.
  ========================================================
  */

  async function handleSend(
    overrideText = null,
    overrideAttachments = null
  ) {

    /*
    Don't allow another request while
    the current one is generating.
    */

    if (
      generationState ===
      "generating"
    ) {

      return
    }


    /*
    Don't allow Send while files are
    already being processed.
    */

    if (uploading) {
      return
    }


    const userText =
      (
        overrideText !== null
          ? overrideText
          : input
      ).trim()


    const files =
      overrideAttachments !==
      null
        ? overrideAttachments
        : attachments


    if (
      !userText &&
      !files.length
    ) {

      return
    }


    const userMessageId =
      createId()


    const assistantMessageId =
      createId()


    const displayText =
      userText ||
      "Please analyze the attached file."


    /*
    --------------------------------------------------------
    USER MESSAGE

    Show immediately.

    Attachments are displayed in the chat while
    they are being processed.
    --------------------------------------------------------
    */

    const userMessage = {

      id:
        userMessageId,

      role:
        "user",

      content:
        displayText,

      attachments:
        files,

      createdAt:
        Date.now(),
    }


    const assistantMessage = {

      id:
        assistantMessageId,

      role:
        "assistant",

      content:
        "",

      status:
        "streaming",

      replyTo:
        userMessageId,

      createdAt:
        Date.now(),
    }


    setMessages(
      (prev) => [

        ...prev,

        userMessage,

        assistantMessage,
      ]
    )


    setInput("")


    /*
    IMPORTANT:

    Clear the input attachment area immediately.

    The local File objects are already stored
    in the `files` variable, so processing can
    continue safely.
    */

    setAttachments([])


    shouldAutoScrollRef.current =
      true


    try {

      /*
      ====================================================
      PROCESS FILES FIRST
      ====================================================

      This is where:

          PDF OCR
          DOCX extraction
          TXT reading
          CSV reading
          XLSX reading
          image processing

      happens.

      NOT when the user selects the file.
      ====================================================
      */

      let processedAttachments =
        files


      if (
        files.length
      ) {

        processedAttachments =
          await processPendingAttachments(
            files
          )
      }


      /*
      ====================================================
      SEND TO AI
      ====================================================

      Only now does /api/chat receive the
      question + processed attachment content.
      ====================================================
      */

      await sendToAI({

        userText:
          displayText,

        userMessageId,

        assistantMessageId,

        requestAttachments:
          processedAttachments,
      })

    } catch (error) {

      console.error(
        "SEND ERROR:",
        error
      )


      updateAssistant(
        assistantMessageId,
        () => ({

          status:
            "error",

          content:
            error?.message ||
            "KLYRO could not answer.",
        })
      )


      setGenerationState(
        "idle"
      )


    } finally {

      /*
      Ensure file processing state
      does not remain stuck.
      */

      setUploading(false)

      focusInput()
    }
  }


  /*
  ========================================================
  PAUSE RESPONSE
  ========================================================
  */

  async function pauseResponse() {

    const active =
      activeGenerationRef.current


    if (
      generationState !==
        "generating" ||
      !active
    ) {

      return
    }


    setGenerationState(
      "paused"
    )


    updateAssistant(
      active.assistantMessageId,
      (item) => ({

        status:
          "paused",

        content:
          item.content ||
          "",
      })
    )


    try {

      await active.reader?.cancel()

    } catch (error) {

      console.warn(
        "Reader cancel warning:",
        error
      )
    }


    try {

      active.controller?.abort()

    } catch (error) {

      console.warn(
        "Abort warning:",
        error
      )
    }


    activeGenerationRef.current =
      null


    focusInput()
  }


  /*
  ========================================================
  REGENERATE
  ========================================================
  */

  async function regenerateMessage(
    assistantMessage
  ) {

    if (
      generationState ===
      "generating"
    ) {

      return
    }


    /*
    Regenerate does not need to upload again
    if the original user message already contains
    processed attachment objects.

    Existing behavior is preserved.
    */

    const userMessage =
      messages.find(
        (item) =>
          item.id ===
          assistantMessage.replyTo
      )


    if (!userMessage) {

      console.warn(
        "Original user message not found."
      )

      return
    }


    const newAssistantId =
      createId()


    const userText =
      userMessage.content ||
      ""


    const requestAttachments =
      userMessage.attachments ||
      []


    /*
    Replace old assistant message.
    */

    setMessages(
      (prev) => {

        const index =
          prev.findIndex(
            (item) =>
              item.id ===
              assistantMessage.id
          )


        if (
          index === -1
        ) {

          return prev
        }


        const copy =
          [...prev]


        copy[index] = {

          ...copy[index],

          id:
            newAssistantId,

          content:
            "",

          status:
            "streaming",

          replyTo:
            userMessage.id,

          createdAt:
            Date.now(),
        }


        return copy
      }
    )


    shouldAutoScrollRef.current =
      true


    scrollToBottom()


    try {

      await sendToAI({

        userText,

        userMessageId:
          userMessage.id,

        assistantMessageId:
          newAssistantId,

        requestAttachments,

        /*
        Remove old assistant response
        from history.
        */

        excludeMessageIds: [
          assistantMessage.id,
        ],
      })

    } catch (error) {

      console.error(
        "REGENERATE ERROR:",
        error
      )


      updateAssistant(
        newAssistantId,
        () => ({

          status:
            "error",

          content:
            error?.message ||
            "KLYRO could not regenerate the response.",
        })
      )


      setGenerationState(
        "idle"
      )
    }
  }


  /*
  ========================================================
  COPY RESPONSE
  ========================================================
  */

  async function copyResponse(
    content,
    messageId
  ) {

    if (!content) {
      return
    }


    try {

      if (
        navigator.clipboard &&
        window.isSecureContext
      ) {

        await navigator.clipboard
          .writeText(
            content
          )

      } else {

        const textarea =
          document.createElement(
            "textarea"
          )


        textarea.value =
          content


        textarea.style.position =
          "fixed"


        textarea.style.opacity =
          "0"


        document.body.appendChild(
          textarea
        )


        textarea.select()


        document.execCommand(
          "copy"
        )


        textarea.remove()
      }


      setCopiedMessageId(
        messageId
      )


      setTimeout(() => {

        setCopiedMessageId(
          null
        )

      }, 1500)

    } catch (error) {

      console.error(
        "COPY ERROR:",
        error
      )
    }
  }


  /*
  ========================================================
  KEYBOARD
  ========================================================
  */

  function handleKeyDown(event) {

    if (
      event.key ===
        "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault()


      if (
        generationState !==
          "generating" &&
        !uploading
      ) {

        handleSend()
      }
    }
  }


  /*
  ========================================================
  NEW CHAT
  ========================================================
  */

  async function newChat() {

    if (
      generationState ===
      "generating"
    ) {

      await pauseResponse()
    }


    setMessages([])

    setInput("")

    setAttachments([])


    setUploading(false)


    setGenerationState(
      "idle"
    )


    shouldAutoScrollRef.current =
      true


    focusInput()
  }


  /*
  ========================================================
  RENDER
  ========================================================
  */

  return (
    <section
      id="ask-klyro"
      className="relative min-h-[760px] overflow-hidden bg-[#070711] px-4 py-16 text-white sm:px-6 lg:px-8"
    >

      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-purple-600/10 blur-[120px]" />


      <div className="relative mx-auto max-w-5xl">

        {/* HEADER */}

        <div className="mb-8 text-center">

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-sm text-purple-200">

            <span>
              ✦
            </span>

            Ask KLYRO

          </div>


          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">

            Your problem.

            <span className="bg-gradient-to-r from-purple-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">

              {" "}
              Your next move.

            </span>

          </h2>


          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">

            Ask questions, solve problems,
            analyze files and understand
            screenshots directly inside KLYRO.

          </p>

        </div>


        {/* MAIN CHAT CARD */}

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-2xl shadow-purple-950/20 backdrop-blur-xl">

          {/* TOP BAR */}

          <div className="flex flex-col gap-3 border-b border-white/10 bg-white/[0.025] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <div className="flex items-center gap-2 text-sm font-semibold">

                <span className="text-purple-300">
                  ✦
                </span>

                KLYRO

              </div>


              <div className="text-xs text-slate-500">

                AI problem solving assistant

              </div>

            </div>


            <div className="flex items-center gap-2">

              {/* MODEL SELECTOR */}

              <select
                value={
                  selectedModel
                }
                onChange={(event) =>
                  setSelectedModel(
                    event.target.value
                  )
                }
                disabled={
                  generationState ===
                  "generating"
                }
                title={
                  MODELS.find(
                    (model) =>
                      model.id ===
                      selectedModel
                  )?.description ||
                  ""
                }
                className="max-w-[190px] rounded-xl border border-white/10 bg-[#11111d] px-3 py-2 text-xs text-slate-300 outline-none transition focus:border-purple-400/40 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {MODELS.map(
                  (model) => (

                    <option
                      key={
                        model.id
                      }
                      value={
                        model.id
                      }
                    >
                      {
                        model.name
                      }
                    </option>

                  )
                )}

              </select>


              {/* NEW CHAT */}

              <button
                type="button"
                onClick={
                  newChat
                }
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10"
              >

                New chat

              </button>

            </div>

          </div>


          {/* CHAT AREA */}

          <div
            ref={
              chatContainerRef
            }
            onScroll={
              handleScroll
            }
            className="h-[500px] overflow-y-auto px-4 py-5 sm:h-[540px] sm:px-6"
          >

            {/* EMPTY STATE */}

            {!messages.length && (

              <div className="flex h-full items-center justify-center">

                <div className="max-w-md text-center">

                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-400/20 bg-purple-500/10 text-2xl">

                    ✦

                  </div>


                  <h3 className="text-lg font-semibold text-slate-100">

                    Ask KLYRO anything

                  </h3>


                  <p className="mt-2 text-sm leading-6 text-slate-500">

                    Ask a question, upload a
                    resume, PDF or screenshot,
                    and KLYRO will work on it.

                  </p>

                </div>

              </div>

            )}


            {/* MESSAGE LIST */}

            <div className="space-y-6">

              {messages.map(
                (message) => {

                  const isUser =
                    message.role ===
                    "user"


                  return (

                    <div
                      key={
                        message.id
                      }
                      className={
                        isUser
                          ? "flex justify-end"
                          : "flex justify-start"
                      }
                    >

                      <div
                        className={
                          isUser
                            ? "max-w-[88%] sm:max-w-[75%]"
                            : "w-full max-w-[92%] sm:max-w-[86%]"
                        }
                      >

                        {/* MESSAGE */}

                        <div
                          className={
                            isUser
                              ? "rounded-2xl rounded-br-md border border-purple-400/20 bg-purple-500/10 px-4 py-3 text-sm leading-6 text-slate-100"
                              : "text-sm leading-7 text-slate-200"
                          }
                        >

                          {/* USER */}

                          {isUser ? (

                            <>

                              <div className="whitespace-pre-wrap">

                                {
                                  message.content
                                }

                              </div>


                              {message.attachments?.length >
                                0 && (

                                <div className="mt-3 flex flex-wrap gap-2">

                                  {message.attachments.map(
                                    (
                                      file,
                                      index
                                    ) => (

                                      <div
                                        key={`${file.name}-${index}`}
                                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300"
                                      >

                                        <span>

                                          {
                                            file.kind ===
                                            "image"
                                              ? "🖼️"
                                              : "📄"
                                          }

                                        </span>


                                        <span className="max-w-[180px] truncate">

                                          {
                                            file.name
                                          }

                                        </span>

                                      </div>

                                    )
                                  )}

                                </div>

                              )}

                            </>

                          ) : (

                            /* AI MESSAGE */

                            <div className="prose prose-invert max-w-none prose-headings:mb-3 prose-headings:mt-5 prose-p:my-3 prose-p:text-slate-200 prose-li:text-slate-200 prose-strong:text-white prose-table:my-5 prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-white/10 prose-th:bg-white/5 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-slate-100 prose-td:border prose-td:border-white/10 prose-td:px-3 prose-td:py-2 prose-td:text-slate-300 prose-code:rounded prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-purple-200 prose-pre:overflow-x-auto prose-pre:rounded-xl prose-pre:border prose-pre:border-white/10 prose-pre:bg-black/30 prose-pre:p-4 prose-a:text-cyan-300"
                            >

                              {message.content ? (

                                <ReactMarkdown
                                  remarkPlugins={[
                                    remarkGfm,
                                    remarkMath,
                                  ]}
                                  rehypePlugins={[
                                    rehypeKatex,
                                  ]}
                                  components={{

                                    h1:
                                      ({
                                        children,
                                      }) => (

                                        <h1 className="text-2xl font-bold text-white">

                                          {
                                            children
                                          }

                                        </h1>

                                      ),


                                    h2:
                                      ({
                                        children,
                                      }) => (

                                        <h2 className="text-xl font-bold text-white">

                                          {
                                            children
                                          }

                                        </h2>

                                      ),


                                    h3:
                                      ({
                                        children,
                                      }) => (

                                        <h3 className="text-lg font-semibold text-white">

                                          {
                                            children
                                          }

                                        </h3>

                                      ),


                                    h4:
                                      ({
                                        children,
                                      }) => (

                                        <h4 className="text-base font-semibold text-white">

                                          {
                                            children
                                          }

                                        </h4>

                                      ),


                                    p:
                                      ({
                                        children,
                                      }) => (

                                        <p className="text-slate-200">

                                          {
                                            children
                                          }

                                        </p>

                                      ),


                                    ul:
                                      ({
                                        children,
                                      }) => (

                                        <ul className="my-3 list-disc space-y-1 pl-6">

                                          {
                                            children
                                          }

                                        </ul>

                                      ),


                                    ol:
                                      ({
                                        children,
                                      }) => (

                                        <ol className="my-3 list-decimal space-y-1 pl-6">

                                          {
                                            children
                                          }

                                        </ol>

                                      ),


                                    li:
                                      ({
                                        children,
                                      }) => (

                                        <li className="text-slate-200">

                                          {
                                            children
                                          }

                                        </li>

                                      ),


                                    blockquote:
                                      ({
                                        children,
                                      }) => (

                                        <blockquote className="my-4 border-l-2 border-purple-400/40 pl-4 text-slate-400">

                                          {
                                            children
                                          }

                                        </blockquote>

                                      ),


                                    table:
                                      ({
                                        children,
                                      }) => (

                                        <div className="my-5 overflow-x-auto rounded-xl border border-white/10">

                                          <table className="w-full border-collapse text-sm">

                                            {
                                              children
                                            }

                                          </table>

                                        </div>

                                      ),


                                    thead:
                                      ({
                                        children,
                                      }) => (

                                        <thead className="bg-white/[0.04]">

                                          {
                                            children
                                          }

                                        </thead>

                                      ),


                                    th:
                                      ({
                                        children,
                                      }) => (

                                        <th className="border border-white/10 px-3 py-2 text-left font-semibold text-white">

                                          {
                                            children
                                          }

                                        </th>

                                      ),


                                    td:
                                      ({
                                        children,
                                      }) => (

                                        <td className="border border-white/10 px-3 py-2 text-slate-300">

                                          {
                                            children
                                          }

                                        </td>

                                      ),


                                    code:
                                      ({
                                        children,
                                        className,
                                      }) => {

                                        const isBlock =
                                          className?.includes(
                                            "language-"
                                          )


                                        if (
                                          isBlock
                                        ) {

                                          return (

                                            <code
                                              className={`${className || ""} block text-sm leading-6 text-slate-200`}
                                            >

                                              {
                                                children
                                              }

                                            </code>

                                          )
                                        }


                                        return (

                                          <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-purple-200">

                                            {
                                              children
                                            }

                                          </code>

                                        )
                                      },


                                    pre:
                                      ({
                                        children,
                                      }) => (

                                        <pre className="my-4 overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-4 text-sm leading-6">

                                          {
                                            children
                                          }

                                        </pre>

                                      ),


                                    hr:
                                      () => (

                                        <hr className="my-5 border-white/10" />

                                      ),


                                    a:
                                      ({
                                        children,
                                        href,
                                      }) => (

                                        <a
                                          href={
                                            href
                                          }
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-cyan-300 underline underline-offset-4 transition hover:text-cyan-200"
                                        >

                                          {
                                            children
                                          }

                                        </a>

                                      ),

                                  }}
                                >

                                  {
                                    message.content
                                  }

                                </ReactMarkdown>

                              ) : (

                                <div className="flex items-center gap-2 text-slate-500">

                                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400" />

                                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400 [animation-delay:150ms]" />

                                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400 [animation-delay:300ms]" />

                                </div>

                              )}

                            </div>

                          )}


                          {/* PAUSED */}

                          {!isUser &&
                            message.status ===
                              "paused" && (

                              <div className="mt-3 rounded-lg border border-yellow-400/10 bg-yellow-400/5 px-3 py-2 text-xs text-yellow-200/70">

                                Response paused. Regenerate it or ask another question.

                              </div>

                          )}


                          {/* ERROR */}

                          {!isUser &&
                            message.status ===
                              "error" && (

                              <div className="mt-3 rounded-lg border border-red-400/10 bg-red-400/5 px-3 py-2 text-xs text-red-200/70">

                                Response could not be completed. Try regenerating the response.

                              </div>

                          )}

                        </div>


                        {/* COPY / REGENERATE */}

                        {!isUser &&
                          message.content && (

                          <div className="mt-3 flex items-center gap-2">

                            {/* COPY */}

                            <button
                              type="button"
                              onClick={() =>
                                copyResponse(
                                  message.content,
                                  message.id
                                )
                              }
                              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                            >

                              {copiedMessageId ===
                              message.id
                                ? "Copied"
                                : "Copy"}

                            </button>


                            {/* REGENERATE */}

                            <button
                              type="button"
                              disabled={
                                generationState ===
                                "generating"
                              }
                              onClick={() =>
                                regenerateMessage(
                                  message
                                )
                              }
                              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >

                              ↻ Regenerate

                            </button>

                          </div>

                        )}

                      </div>

                    </div>

                  )
                }
              )}

            </div>

          </div>


          {/* INPUT AREA */}

          <div className="border-t border-white/10 bg-white/[0.025] p-4">

            {/* ATTACHMENTS */}

            {attachments.length >
              0 && (

              <div className="mb-3 flex flex-wrap gap-2">

                {attachments.map(
                  (
                    file,
                    index
                  ) => (

                    <div
                      key={
                        file.id ||
                        `${file.name}-${index}`
                      }
                      className="flex items-center gap-2 rounded-xl border border-purple-400/10 bg-purple-500/5 px-3 py-2 text-xs text-slate-300"
                    >

                      <span>

                        {
                          file.kind ===
                          "image"
                            ? "🖼️"
                            : "📄"
                        }

                      </span>


                      <span className="max-w-[180px] truncate">

                        {
                          file.name
                        }

                      </span>


                      {/* PENDING INDICATOR */}

                      {file.status ===
                        "pending" && (

                        <span className="text-[10px] text-slate-600">

                          Ready

                        </span>

                      )}


                      <button
                        type="button"
                        disabled={
                          uploading
                        }
                        onClick={() =>
                          removeAttachment(
                            index
                          )
                        }
                        className="text-slate-500 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >

                        ×

                      </button>

                    </div>

                  )
                )}

              </div>

            )}


            {/* INPUT BOX */}

            <div className="rounded-2xl border border-white/10 bg-black/20 p-2">

              <textarea
                ref={
                  textareaRef
                }
                value={
                  input
                }
                onChange={(event) =>
                  setInput(
                    event.target.value
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                rows={2}
                placeholder={
                  uploading
                    ? "Reading your file..."
                    : generationState ===
                      "paused"
                      ? "Ask KLYRO again..."
                      : "Ask KLYRO anything..."
                }
                disabled={
                  uploading
                }
                className="min-h-[60px] w-full resize-none bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600"
              />


              {/* INPUT ACTIONS */}

              <div className="flex items-center justify-between gap-2 px-2 pb-1">

                <div className="flex items-center gap-2">

                  <input
                    ref={
                      fileInputRef
                    }
                    type="file"
                    hidden
                    multiple
                    accept=".pdf,.docx,.txt,.md,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.webp"
                    onChange={
                      handleFileChange
                    }
                  />


                  {/* FILE BUTTON */}

                  <button
                    type="button"
                    disabled={
                      uploading ||
                      generationState ===
                        "generating" ||
                      attachments.length >=
                        3
                    }
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >

                    {uploading
                      ? "Reading..."
                      : "📎 File"}

                  </button>


                  <span className="hidden text-[11px] text-slate-600 sm:block">

                    PDF · DOCX · TXT · CSV · XLSX · Image

                  </span>

                </div>


                {/* PAUSE / SEND */}

                {generationState ===
                "generating" ? (

                  <button
                    type="button"
                    onClick={
                      pauseResponse
                    }
                    className="flex items-center gap-2 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-semibold text-yellow-200 transition hover:bg-yellow-400/15 active:scale-95"
                  >

                    <span className="h-2 w-2 rounded-sm bg-yellow-300" />

                    Pause

                  </button>

                ) : (

                  <button
                    type="button"
                    disabled={
                      uploading ||
                      (
                        !input.trim() &&
                        !attachments.length
                      )
                    }
                    onClick={() =>
                      handleSend()
                    }
                    className="rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-950/30 transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  >

                    {uploading
                      ? "Reading..."
                      : "Send"}

                  </button>

                )}

              </div>

            </div>


            {/* STATUS */}

            <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-slate-600">

              <span>

                Enter to send · Shift + Enter for new line

              </span>


              {uploading && (

                <span className="text-purple-400/70">

                  Reading your file...

                </span>

              )}


              {!uploading &&
                generationState ===
                  "generating" && (

                <span className="text-yellow-500/70">

                  KLYRO is working...

                </span>

              )}


              {!uploading &&
                generationState ===
                  "paused" && (

                <span className="text-yellow-500/70">

                  Response paused

                </span>

              )}

            </div>

          </div>

        </div>

      </div>

    </section>
  )
}