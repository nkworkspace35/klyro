const {
  buildChatMessages,
  cleanFinalResponse,

  createConversation,
  getConversationById,
  saveMessage,
  saveAttachment,
} = require("../services/conversationService")


/*
==========================================================
KLYRO AI MODELS
==========================================================
*/

const FAST_MODEL =
  "openai/gpt-oss-20b"

const DEEP_MODEL =
  "openai/gpt-oss-120b"

const VISION_MODEL =
  "qwen/qwen3.8-27b"


const ALLOWED_MODELS = [
  FAST_MODEL,
  DEEP_MODEL,
  VISION_MODEL,
]


/*
==========================================================
SSE EVENT HELPER
==========================================================
*/

function sendEvent(
  res,
  event,
  data
) {
  if (
    res.writableEnded ||
    res.destroyed
  ) {
    return false
  }

  try {
    res.write(
      `event: ${event}\n`
    )

    res.write(
      `data: ${JSON.stringify(data)}\n\n`
    )

    if (
      typeof res.flush === "function"
    ) {
      res.flush()
    }

    return true

  } catch (error) {
    return false
  }
}


/*
==========================================================
MATH QUESTION DETECTION
==========================================================
*/

function isMathQuestion(
  text = ""
) {
  const value =
    String(text)
      .toLowerCase()

  const mathWords = [
    "solve",
    "calculate",
    "simplify",
    "equation",
    "integral",
    "derivative",
    "differentiate",
    "factor",
    "factorize",
    "percentage",
    "percent",
    "multiply",
    "divide",
    "algebra",
    "quadratic",
    "trigonometry",
    "geometry",
    "probability",
    "statistics",
    "math",
    "mathematics",

    "गणित",
    "हल करो",
    "हल करें",
    "हल",
    "प्रतिशत",
    "गुणा",
    "भाग",
    "जोड़",
    "घटाव",
  ]

  const hasMathWord =
    mathWords.some(
      (word) =>
        value.includes(word)
    )

  const hasMathExpression =
    /\d+\s*[+\-*/=]\s*\d+/
      .test(value)

  const hasNumberPattern =
    /\d+\s*%\s*(of|का|के|की)?/
      .test(value)

  const hasVariableEquation =
    /[a-z]\s*[+\-*/=]\s*\d+/i
      .test(value)

  return (
    hasMathWord ||
    hasMathExpression ||
    hasNumberPattern ||
    hasVariableEquation
  )
}


/*
==========================================================
TECHNICAL QUESTION DETECTION
==========================================================
*/

function isTechnicalQuestion(
  text = ""
) {
  const value =
    String(text)
      .toLowerCase()

  const technicalWords = [
    "code",
    "coding",
    "program",
    "programming",

    "javascript",
    "typescript",

    "react",
    "reactjs",

    "node",
    "nodejs",

    "express",

    "python",
    "java",

    "c++",
    "c language",

    "mysql",
    "postgresql",
    "postgres",
    "sql",

    "api",

    "bug",
    "error",
    "debug",
    "debugging",

    "html",
    "css",
    "bootstrap",

    "git",
    "github",

    "backend",
    "frontend",

    "database",

    "linux",

    "server",

    "npm",

    "json",

    "php",
    "laravel",

    "framework",

    "software",

    "terminal",
    "command",

    "function",
    "variable",
    "class",
    "component",

    "deployment",
    "vercel",
    "render",

    "docker",
    "authentication",
    "authorization",
  ]

  return technicalWords.some(
    (word) =>
      value.includes(word)
  )
}


/*
==========================================================
MODEL SELECTION
==========================================================
*/

function chooseModel({
  requestedModel,
  fastMode,
  hasImages,
}) {

  // Images always use the vision model.
  if (hasImages) {
    return VISION_MODEL
  }

  // Explicit model selection.
  if (
    requestedModel &&
    ALLOWED_MODELS.includes(
      requestedModel
    )
  ) {
    return requestedModel
  }

  // Default model.
  if (fastMode) {
    return FAST_MODEL
  }

  return DEEP_MODEL
}


/*
==========================================================
REASONING CONFIGURATION
==========================================================
*/

function getReasoningEffort(
  model,
  message
) {

  if (
    model === VISION_MODEL
  ) {
    if (
      isMathQuestion(message) ||
      isTechnicalQuestion(message)
    ) {
      return "medium"
    }

    return "low"
  }

  if (
    model === FAST_MODEL
  ) {
    if (
      isMathQuestion(message) ||
      isTechnicalQuestion(message)
    ) {
      return "medium"
    }

    return "low"
  }

  if (
    model === DEEP_MODEL
  ) {
    if (
      isMathQuestion(message) ||
      isTechnicalQuestion(message)
    ) {
      return "medium"
    }

    return "low"
  }

  return "low"
}


/*
==========================================================
TOKEN BUDGET
==========================================================
*/

function getTokenBudget({
  model,
  hasImages,
  hasDocuments,
  message,
}) {

  let budget = 450

  if (
    isMathQuestion(message) ||
    isTechnicalQuestion(message)
  ) {
    budget = 650
  }

  if (hasDocuments) {
    budget = 900
  }

  if (hasImages) {
    budget = 800
  }

  if (
    model === DEEP_MODEL
  ) {
    budget = 1000
  }

  return budget
}


/*
==========================================================
REQUESTED MODEL VALIDATION
==========================================================
*/

function getRequestedModel(
  value
) {

  if (
    typeof value !== "string"
  ) {
    return null
  }

  const model =
    value.trim()

  if (
    !ALLOWED_MODELS.includes(
      model
    )
  ) {
    return null
  }

  return model
}


/*
==========================================================
AUTHENTICATED USER ID
==========================================================
*/

function getAuthenticatedUserId(
  req
) {

  if (!req.user) {
    return null
  }

  /*
  Existing JWT currently uses:
  req.user.userId

  The additional fallbacks make the controller
  safer if the JWT structure changes later.
  */

  return (
    req.user.userId ||
    req.user.id ||
    req.user.user_id ||
    null
  )
}


/*
==========================================================
CONVERSATION ID HANDLER
==========================================================
*/

async function getOrCreateConversation(
  userId,
  conversationId
) {

  /*
  --------------------------------------------------------
  EXISTING CONVERSATION
  --------------------------------------------------------
  */

  if (
    conversationId &&
    typeof conversationId === "string"
  ) {

    const conversation =
      await getConversationById(
        conversationId,
        userId
      )

    if (!conversation) {

      const error =
        new Error(
          "Conversation not found."
        )

      error.statusCode =
        404

      throw error
    }

    return conversation
  }


  /*
  --------------------------------------------------------
  CREATE NEW CONVERSATION
  --------------------------------------------------------
  */

  return await createConversation(
    userId,
    "New Chat"
  )
}


/*
==========================================================
ATTACHMENT DATABASE HELPER
==========================================================
*/

async function saveMessageAttachments(
  messageId,
  attachments
) {

  if (
    !messageId ||
    !Array.isArray(attachments) ||
    attachments.length === 0
  ) {
    return
  }

  for (
    const attachment
    of attachments
  ) {

    if (
      !attachment ||
      typeof attachment !== "object"
    ) {
      continue
    }

    try {

      await saveAttachment({

        messageId,

        fileName:
          attachment.fileName ||
          attachment.file_name ||
          "Unnamed file",

        fileType:
          attachment.fileType ||
          attachment.file_type ||
          attachment.mimeType ||
          null,

        fileUrl:
          attachment.fileUrl ||
          attachment.file_url ||
          attachment.url ||
          null,

        extractedText:
          attachment.text ||
          attachment.extractedText ||
          attachment.extracted_text ||
          null,

        extractionMethod:
          attachment.extractionMethod ||
          attachment.extraction_method ||
          null,
      })

    } catch (error) {

      /*
      Attachment persistence failure must not
      destroy a successful AI response.
      */

      console.error(
        "KLYRO ATTACHMENT SAVE ERROR:",
        error?.message
      )
    }
  }
}


/*
==========================================================
MAIN CHAT CONTROLLER
==========================================================
*/

async function chatWithKlyro(
  req,
  res
) {

  /*
  ========================================================
  CHECK AUTHENTICATED USER
  ========================================================
  */

  const userId =
    getAuthenticatedUserId(req)

  if (!userId) {

    return res
      .status(401)
      .json({

        success: false,

        message:
          "Authenticated user is required.",
      })
  }


  /*
  ========================================================
  CHECK GROQ API KEY
  ========================================================
  */

  if (
    !process.env.GROQ_API_KEY
  ) {

    return res
      .status(500)
      .json({

        success: false,

        message:
          "GROQ_API_KEY is not configured on the server.",
      })
  }


  /*
  ========================================================
  REQUEST DATA
  ========================================================
  */

  const body =
    req.body || {}

  const message =
    String(
      body.message || ""
    ).trim()

  const history =
    Array.isArray(body.history)
      ? body.history
      : []

  const attachments =
    Array.isArray(
      body.attachments
    )
      ? body.attachments.slice(0, 3)
      : []


  /*
  ========================================================
  CONVERSATION ID
  ========================================================
  */

  const requestedConversationId =
    typeof body.conversationId === "string"
      ? body.conversationId.trim()
      : null


  /*
  ========================================================
  FAST MODE
  ========================================================
  */

  const fastMode =
    body.fastMode !== false


  /*
  ========================================================
  VALIDATION
  ========================================================
  */

  if (
    !message &&
    attachments.length === 0
  ) {

    return res
      .status(400)
      .json({

        success: false,

        message:
          "Message or attachment is required.",
      })
  }


  /*
  ========================================================
  GET OR CREATE CONVERSATION
  ========================================================
  */

  let conversation

  try {

    conversation =
      await getOrCreateConversation(
        userId,
        requestedConversationId
      )

  } catch (error) {

    console.error(
      "KLYRO CONVERSATION ERROR:",
      error
    )

    return res
      .status(
        error?.statusCode || 500
      )
      .json({

        success: false,

        message:
          error?.message ||
          "Could not create or access the conversation.",
      })
  }


  const conversationId =
    conversation.id


  /*
  ========================================================
  ATTACHMENT DETECTION
  ========================================================
  */

  const hasImages =
    attachments.some(
      (file) =>
        file &&
        file.kind === "image" &&
        file.dataUrl
    )

  const hasDocuments =
    attachments.some(
      (file) =>
        file &&
        file.kind === "document" &&
        file.text
    )


  /*
  ========================================================
  REQUESTED MODEL
  ========================================================
  */

  const requestedModel =
    getRequestedModel(
      body.model
    )


  /*
  ========================================================
  MODEL SELECTION
  ========================================================
  */

  const model =
    chooseModel({

      requestedModel,

      fastMode,

      hasImages,
    })


  /*
  ========================================================
  BUILD AI MESSAGES
  ========================================================
  */

  let built

  try {

    built =
      buildChatMessages({

        message,

        history,

        attachments,

        fastMode,
      })

  } catch (error) {

    console.error(
      "KLYRO MESSAGE BUILD ERROR:",
      error
    )

    return res
      .status(500)
      .json({

        success: false,

        message:
          "KLYRO could not prepare the conversation.",
      })
  }


  /*
  ========================================================
  SAVE USER MESSAGE
  ========================================================
  */

  let userMessageRecord = null

  try {

    userMessageRecord =
      await saveMessage({

        conversationId,

        role: "user",

        content:
          message ||
          "Attached file(s)",

        model: null,
      })


    await saveMessageAttachments(
      userMessageRecord.id,
      attachments
    )

  } catch (error) {

    console.error(
      "KLYRO USER MESSAGE SAVE ERROR:",
      error
    )

    return res
      .status(500)
      .json({

        success: false,

        message:
          "KLYRO could not save your message.",
      })
  }


  /*
  ========================================================
  ABORT CONTROLLER
  ========================================================
  */

  const controller =
    new AbortController()

  let clientGone =
    false

  let streamFinished =
    false

  let reader =
    null


  /*
  ========================================================
  ABORT GENERATION
  ========================================================
  */

  function abortGeneration() {

    if (
      streamFinished
    ) {
      return
    }

    clientGone =
      true

    if (reader) {

      try {
        reader.cancel()
      } catch (error) {}
    }

    try {
      controller.abort()
    } catch (error) {}
  }


  /*
  ========================================================
  CLIENT REQUEST ABORT
  ========================================================
  */

  function onRequestAborted() {
    abortGeneration()
  }


  /*
  ========================================================
  RESPONSE CLOSED
  ========================================================
  */

  function onResponseClose() {

    if (
      streamFinished
    ) {
      return
    }

    if (
      !res.writableEnded
    ) {
      abortGeneration()
    }
  }


  req.on(
    "aborted",
    onRequestAborted
  )

  res.on(
    "close",
    onResponseClose
  )


  /*
  ========================================================
  SSE HEADERS
  ========================================================
  */

  res.status(200)

  res.setHeader(
    "Content-Type",
    "text/event-stream; charset=utf-8"
  )

  res.setHeader(
    "Cache-Control",
    "no-cache, no-transform"
  )

  res.setHeader(
    "Connection",
    "keep-alive"
  )

  res.setHeader(
    "X-Accel-Buffering",
    "no"
  )

  res.setHeader(
    "X-Content-Type-Options",
    "nosniff"
  )


  if (
    typeof res.flushHeaders === "function"
  ) {
    res.flushHeaders()
  }


  /*
  ========================================================
  KEEP CONNECTION ALIVE
  ========================================================
  */

  try {

    res.write(
      ": klyro-stream\n\n"
    )

  } catch (error) {

    abortGeneration()

    return
  }


  /*
  ========================================================
  START AI REQUEST
  ========================================================
  */

  try {

    /*
    ------------------------------------------------------
    META EVENT
    ------------------------------------------------------
    */

    sendEvent(
      res,
      "meta",
      {

        model,

        language:
          built.language,

        fast:
          model === FAST_MODEL,

        deep:
          model === DEEP_MODEL,

        vision:
          model === VISION_MODEL,

        hasImages,

        hasDocuments,

        conversationId,
      }
    )


    /*
    ------------------------------------------------------
    TOKEN BUDGET
    ------------------------------------------------------
    */

    const tokenBudget =
      getTokenBudget({

        model,

        hasImages,

        hasDocuments,

        message,
      })


    /*
    ------------------------------------------------------
    REASONING
    ------------------------------------------------------
    */

    const reasoningEffort =
      getReasoningEffort(
        model,
        message
      )


    /*
    ------------------------------------------------------
    TEMPERATURE
    ------------------------------------------------------
    */

    let temperature =
      0.35

    if (
      model === VISION_MODEL
    ) {
      temperature =
        0.7
    }

    if (
      model === DEEP_MODEL
    ) {
      temperature =
        0.3
    }


    /*
    ======================================================
    GROQ REQUEST BODY
    ======================================================
    */

    const requestBody = {

      model,

      messages:
        built.messages,

      stream:
        true,

      temperature,

      max_completion_tokens:
        tokenBudget,

      reasoning_effort:
        reasoningEffort,

      reasoning_format:
        "hidden",
    }


    /*
    ======================================================
    SEND REQUEST TO GROQ
    ======================================================
    */

    const groqResponse =
      await fetch(

        "https://api.groq.com/openai/v1/chat/completions",

        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${process.env.GROQ_API_KEY}`,

            Accept:
              "text/event-stream",
          },

          body:
            JSON.stringify(
              requestBody
            ),

          signal:
            controller.signal,
        }
      )


    /*
    ======================================================
    GROQ ERROR
    ======================================================
    */

    if (
      !groqResponse.ok
    ) {

      const errorText =
        await groqResponse.text()

      let errorMessage =
        "AI provider request failed."

      let errorCode =
        null


      try {

        const parsed =
          JSON.parse(
            errorText
          )

        errorMessage =
          parsed?.error?.message ||
          errorMessage

        errorCode =
          parsed?.error?.code ||
          null

      } catch (error) {

        if (
          errorText
        ) {

          errorMessage =
            errorText.slice(
              0,
              700
            )
        }
      }


      /*
      ----------------------------------------------------
      RATE LIMIT
      ----------------------------------------------------
      */

      if (
        groqResponse.status === 429
      ) {

        errorMessage =
          "KLYRO AI rate limit reached. Please wait a moment and try again."
      }


      /*
      ----------------------------------------------------
      AUTH ERROR
      ----------------------------------------------------
      */

      if (
        groqResponse.status === 401
      ) {

        errorMessage =
          "GROQ_API_KEY is invalid or expired."
      }


      /*
      ----------------------------------------------------
      MODEL ERROR
      ----------------------------------------------------
      */

      if (
        groqResponse.status === 400 &&
        (
          errorMessage
            .toLowerCase()
            .includes("model") ||
          errorMessage
            .toLowerCase()
            .includes("reasoning")
        )
      ) {

        errorMessage =
          `Groq rejected the model configuration: ${errorMessage}`
      }


      console.error(
        "GROQ API ERROR:",
        {

          status:
            groqResponse.status,

          code:
            errorCode,

          model,

          message:
            errorMessage,
        }
      )


      throw new Error(
        errorMessage
      )
    }


    /*
    ========================================================
    CHECK RESPONSE BODY
    ========================================================
    */

    if (
      !groqResponse.body
    ) {

      throw new Error(
        "AI stream is unavailable."
      )
    }


    /*
    ========================================================
    CREATE STREAM READER
    ========================================================
    */

    reader =
      groqResponse
        .body
        .getReader()

    const decoder =
      new TextDecoder(
        "utf-8"
      )

    let buffer =
      ""

    let fullText =
      ""


    /*
    ========================================================
    PROCESS SSE EVENT
    ========================================================
    */

    function processSSEEvent(
      rawEvent
    ) {

      if (
        !rawEvent ||
        clientGone
      ) {
        return
      }


      const lines =
        rawEvent
          .replace(
            /\r\n/g,
            "\n"
          )
          .replace(
            /\r/g,
            "\n"
          )
          .split("\n")


      const dataLines =
        lines
          .filter(
            (line) =>
              line.startsWith(
                "data:"
              )
          )
          .map(
            (line) =>
              line
                .slice(5)
                .trim()
          )


      if (
        !dataLines.length
      ) {
        return
      }


      const data =
        dataLines.join("\n")


      if (
        !data ||
        data === "[DONE]"
      ) {
        return
      }


      let parsed

      try {

        parsed =
          JSON.parse(
            data
          )

      } catch (error) {

        return
      }


      /*
      ------------------------------------------------------
      EXTRACT CONTENT
      ------------------------------------------------------
      */

      const delta =
        parsed
          ?.choices?.[0]
          ?.delta
          ?.content ||
        ""


      if (
        !delta
      ) {
        return
      }


      /*
      ------------------------------------------------------
      STORE RESPONSE
      ------------------------------------------------------
      */

      fullText +=
        delta


      /*
      ------------------------------------------------------
      SEND CHUNK TO FRONTEND
      ------------------------------------------------------
      */

      const sent =
        sendEvent(
          res,
          "chunk",
          {
            text:
              delta,
          }
        )


      if (
        !sent
      ) {
        clientGone =
          true
      }
    }


    /*
    ========================================================
    READ GROQ STREAM
    ========================================================
    */

    while (
      !clientGone
    ) {

      const result =
        await reader.read()


      /*
      ------------------------------------------------------
      STREAM COMPLETE
      ------------------------------------------------------
      */

      if (
        result.done
      ) {
        break
      }


      /*
      ------------------------------------------------------
      DECODE
      ------------------------------------------------------
      */

      if (
        result.value
      ) {

        buffer +=
          decoder.decode(
            result.value,
            {
              stream: true,
            }
          )
      }


      /*
      ------------------------------------------------------
      NORMALIZE SSE LINE ENDINGS
      ------------------------------------------------------
      */

      buffer =
        buffer.replace(
          /\r\n/g,
          "\n"
        )

      buffer =
        buffer.replace(
          /\r/g,
          "\n"
        )


      /*
      ------------------------------------------------------
      SPLIT EVENTS
      ------------------------------------------------------
      */

      const events =
        buffer.split(
          "\n\n"
        )


      buffer =
        events.pop() || ""


      /*
      ------------------------------------------------------
      PROCESS COMPLETE EVENTS
      ------------------------------------------------------
      */

      for (
        const event
        of events
      ) {

        if (
          clientGone
        ) {
          break
        }

        processSSEEvent(
          event
        )
      }
    }


    /*
    ========================================================
    FLUSH DECODER
    ========================================================
    */

    if (
      !clientGone
    ) {

      buffer +=
        decoder.decode()

      buffer =
        buffer.replace(
          /\r\n/g,
          "\n"
        )

      buffer =
        buffer.replace(
          /\r/g,
          "\n"
        )

      if (
        buffer.trim()
      ) {

        processSSEEvent(
          buffer
        )
      }
    }


    /*
    ========================================================
    PAUSED / ABORTED
    ========================================================
    */

    if (
      clientGone ||
      controller.signal.aborted
    ) {
      return
    }


    /*
    ========================================================
    EMPTY RESPONSE
    ========================================================
    */

    if (
      !fullText.trim()
    ) {

      throw new Error(
        "KLYRO received an empty response from the AI model."
      )
    }


    /*
    ========================================================
    CLEAN FINAL RESPONSE
    ========================================================
    */

    const finalText =
      cleanFinalResponse(
        fullText
      )


    /*
    ========================================================
    SAVE ASSISTANT MESSAGE
    ========================================================
    */

    let assistantMessageRecord =
      null

    try {

      assistantMessageRecord =
        await saveMessage({

          conversationId,

          role: "assistant",

          content:
            finalText,

          model,
        })

    } catch (error) {

      /*
      AI response already exists in the
      frontend, but persistence failed.
      */

      console.error(
        "KLYRO ASSISTANT MESSAGE SAVE ERROR:",
        error
      )
    }


    /*
    ========================================================
    FINAL EVENT
    ========================================================
    */

    sendEvent(
      res,
      "final",
      {

        text:
          finalText,

        conversationId,

        messageId:
          assistantMessageRecord?.id ||
          null,
      }
    )


    /*
    ========================================================
    DONE EVENT
    ========================================================
    */

    sendEvent(
      res,
      "done",
      {

        success:
          true,

        model,

        language:
          built.language,

        hasImages,

        hasDocuments,

        conversationId,

        userMessageId:
          userMessageRecord?.id ||
          null,

        assistantMessageId:
          assistantMessageRecord?.id ||
          null,
      }
    )


    /*
    Mark stream finished before
    response close can fire.
    */

    streamFinished =
      true

  } catch (error) {

    /*
    ========================================================
    ABORT ERROR
    ========================================================
    */

    if (
      controller.signal.aborted ||
      clientGone ||
      error?.name ===
        "AbortError"
    ) {
      return
    }


    /*
    ========================================================
    SERVER ERROR LOG
    ========================================================
    */

    console.error(
      "KLYRO CHAT ERROR:",
      {

        message:
          error?.message,

        stack:
          error?.stack,

        model,

        conversationId,
      }
    )


    /*
    ========================================================
    SEND ERROR TO FRONTEND
    ========================================================
    */

    if (
      !res.writableEnded &&
      !res.destroyed
    ) {

      sendEvent(
        res,
        "error",
        {

          message:
            error?.message ||
            "KLYRO could not complete the response.",
        }
      )

      sendEvent(
        res,
        "done",
        {

          success:
            false,

          conversationId,
        }
      )
    }

  } finally {

    /*
    ========================================================
    STREAM FINISHED
    ========================================================
    */

    streamFinished =
      true


    /*
    ========================================================
    REMOVE EVENT LISTENERS
    ========================================================
    */

    req.off(
      "aborted",
      onRequestAborted
    )

    res.off(
      "close",
      onResponseClose
    )


    /*
    ========================================================
    RELEASE READER
    ========================================================
    */

    try {

      if (
        reader
      ) {
        reader.releaseLock()
      }

    } catch (error) {}


    reader =
      null
  }
}


/*
==========================================================
TEST AI
==========================================================
*/

async function testAI(
  req,
  res
) {

  /*
  --------------------------------------------------------
  CHECK API KEY
  --------------------------------------------------------
  */

  if (
    !process.env.GROQ_API_KEY
  ) {

    return res
      .status(500)
      .json({

        success: false,

        message:
          "GROQ_API_KEY is missing.",
      })
  }


  try {

    /*
    ------------------------------------------------------
    TEST REQUEST
    ------------------------------------------------------
    */

    const response =
      await fetch(

        "https://api.groq.com/openai/v1/chat/completions",

        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${process.env.GROQ_API_KEY}`,
          },

          body:
            JSON.stringify({

              model:
                FAST_MODEL,

              messages: [

                {

                  role:
                    "system",

                  content:
                    "Reply with one short sentence.",
                },

                {

                  role:
                    "user",

                  content:
                    "Say KLYRO AI is working.",
                },
              ],

              max_completion_tokens:
                30,

              reasoning_effort:
                "low",

              reasoning_format:
                "hidden",
            }),
        }
      )


    /*
    ------------------------------------------------------
    PARSE RESPONSE
    ------------------------------------------------------
    */

    const data =
      await response.json()


    /*
    ------------------------------------------------------
    GROQ ERROR
    ------------------------------------------------------
    */

    if (
      !response.ok
    ) {

      return res
        .status(
          response.status
        )
        .json({

          success: false,

          message:
            data?.error?.message ||
            "Groq request failed.",
        })
    }


    /*
    ------------------------------------------------------
    SUCCESS
    ------------------------------------------------------
    */

    return res.json({

      success:
        true,

      model:
        FAST_MODEL,

      text:
        data
          ?.choices?.[0]
          ?.message
          ?.content ||
        "KLYRO AI is working.",
    })

  } catch (error) {

    console.error(
      "KLYRO TEST AI ERROR:",
      error
    )

    return res
      .status(500)
      .json({

        success: false,

        message:
          error?.message ||
          "AI test failed.",
      })
  }
}


/*
==========================================================
EXPORT
==========================================================
*/

module.exports = {
  chatWithKlyro,
  testAI,
}