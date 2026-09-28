import { useEffect, useRef, useState } from "react"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"

/* =========================================================
   MODELS
========================================================= */

const MODELS = [
  {
    id: "klyro",
    name: "KLYRO",
    description:
      "KLYRO intelligent problem-solving model",
  },
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

/* =========================================================
   HELPERS
========================================================= */

function createId() {
  return (
    Date.now().toString() +
    Math.random()
      .toString(36)
      .slice(2)
  )
}

function normalizeToken(value) {
  if (!value) {
    return ""
  }

  let token = value

  if (
    typeof token === "string" &&
    token.trim().startsWith("{")
  ) {
    try {
      const parsed = JSON.parse(token)

      token =
        parsed?.token ||
        parsed?.accessToken ||
        parsed?.access_token ||
        ""
    } catch {
      token = ""
    }
  }

  if (
    typeof token !== "string"
  ) {
    return ""
  }

  token = token.trim()

  if (
    token
      .toLowerCase()
      .startsWith("bearer ")
  ) {
    token = token.slice(7).trim()
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

  /* localStorage */

  for (const key of preferredKeys) {
    const value =
      localStorage.getItem(key)

    const token =
      normalizeToken(value)

    if (token) {
      return token
    }
  }

  /* sessionStorage */

  for (const key of preferredKeys) {
    const value =
      sessionStorage.getItem(key)

    const token =
      normalizeToken(value)

    if (token) {
      return token
    }
  }

  /* JWT-like token fallback */

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
        localStorage.getItem(key)

      const token =
        normalizeToken(value)

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
      "Token scan failed:",
      error
    )
  }

  return ""
}

/* =========================================================
   IMAGE COMPRESSION
========================================================= */

function compressImage(file) {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader()

      reader.onload = () => {
        const image =
          new Image()

        image.onload = () => {
          const maxSize = 1600

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

            width = Math.round(
              width * ratio
            )

            height = Math.round(
              height * ratio
            )
          }

          const canvas =
            document.createElement(
              "canvas"
            )

          canvas.width = width
          canvas.height = height

          const context =
            canvas.getContext(
              "2d"
            )

          if (!context) {
            reject(
              new Error(
                "Image processing is unavailable."
              )
            )

            return
          }

          context.drawImage(
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

              const compressedFile =
                new File(
                  [blob],
                  file.name,
                  {
                    type: "image/jpeg",
                    lastModified:
                      Date.now(),
                  }
                )

              resolve(
                compressedFile
              )
            },
            "image/jpeg",
            0.82
          )
        }

        image.onerror = () => {
          reject(
            new Error(
              "Unable to read image."
            )
          )
        }

        image.src =
          reader.result
      }

      reader.onerror = () => {
        reject(
          new Error(
            "Unable to load image."
          )
        )
      }

      reader.readAsDataURL(file)
    }
  )
}

/* =========================================================
   HERO COMPONENT
========================================================= */

export default function Hero() {
  /* =======================================================
     CHAT STATE
  ======================================================= */

  const [
    messages,
    setMessages,
  ] = useState([])

  const [
    conversationId,
    setConversationId,
  ] = useState(null)

  const [
    activeConversationLoading,
    setActiveConversationLoading,
  ] = useState(false)

  const [
    input,
    setInput,
  ] = useState("")

  const [
    generationState,
    setGenerationState,
  ] = useState("idle")

  const [
    uploading,
    setUploading,
  ] = useState(false)

  const [
    attachments,
    setAttachments,
  ] = useState([])

  /* =======================================================
     AI CONTROLS

     composerExpanded intentionally removed.
     Controls are permanently visible.
  ======================================================= */

  const [
    searchMode,
    setSearchMode,
  ] = useState(false)

  const [
    deepMindMode,
    setDeepMindMode,
  ] = useState(false)

  const [
    modelMenuOpen,
    setModelMenuOpen,
  ] = useState(false)

  const [
    selectedModel,
    setSelectedModel,
  ] = useState(() => {
    try {
      const saved =
        localStorage.getItem(
          "klyro_model"
        )

      const exists =
        MODELS.some(
          (model) =>
            model.id === saved
        )

      return exists
        ? saved
        : "klyro"
    } catch {
      return "klyro"
    }
  })

  const [
    copiedMessageId,
    setCopiedMessageId,
  ] = useState(null)

  /* =======================================================
     REFS
  ======================================================= */

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

  /* =======================================================
     SAVE MODEL
  ======================================================= */

  useEffect(() => {
    try {
      localStorage.setItem(
        "klyro_model",
        selectedModel
      )
    } catch {
      // Ignore storage errors
    }
  }, [selectedModel])

  /* =======================================================
     TEXTAREA AUTO RESIZE
  ======================================================= */

  useEffect(() => {
    const textarea =
      textareaRef.current

    if (!textarea) {
      return
    }

    textarea.style.height =
      "auto"

    const maxHeight = 180

    textarea.style.height =
      `${Math.min(
        textarea.scrollHeight,
        maxHeight
      )}px`
  }, [input])

  /* =======================================================
     CLEANUP
  ======================================================= */

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
        } catch {}

        try {
          active.controller?.abort()
        } catch {}
      }
    }
  }, [])

  /* =======================================================
     AUTO SCROLL
  ======================================================= */

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

  function focusInput() {
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 50)
  }

  /* =======================================================
     UPDATE ASSISTANT MESSAGE
  ======================================================= */

  function updateAssistant(
    assistantId,
    updater
  ) {
    setMessages((previous) =>
      previous.map((message) => {
        if (
          message.id !==
          assistantId
        ) {
          return message
        }

        return {
          ...message,
          ...updater(message),
        }
      })
    )
  }

  /* =======================================================
     LOAD CONVERSATION
  ======================================================= */

  async function loadConversation(
    selectedConversationId,
    suppliedConversation = null
  ) {
    if (
      !selectedConversationId &&
      !suppliedConversation
    ) {
      return
    }

    if (
      generationState ===
      "generating"
    ) {
      await pauseResponse()
    }

    setActiveConversationLoading(
      true
    )

    try {
      let conversation =
        suppliedConversation

      if (!conversation) {
        const token =
          getToken()

        if (!token) {
          throw new Error(
            "Please login first."
          )
        }

        const response =
          await fetch(
            `${API_URL}/api/conversations/${selectedConversationId}`,
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          )

        let data = null

        try {
          data =
            await response.json()
        } catch {
          data = null
        }

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to load conversation."
          )
        }

        conversation =
          data?.conversation ||
          data?.data ||
          data
      }

      const actualConversationId =
        conversation?.id ||
        conversation?._id ||
        selectedConversationId

      const loadedMessages =
        Array.isArray(
          conversation?.messages
        )
          ? conversation.messages
          : Array.isArray(
              conversation?.data?.messages
            )
            ? conversation.data.messages
            : []

      const normalizedMessages =
        loadedMessages.map(
          (message) => {
            const role =
              message.role ===
              "assistant"
                ? "assistant"
                : "user"

            const rawAttachments =
              Array.isArray(
                message.attachments
              )
                ? message.attachments
                : []

            const normalizedAttachments =
              rawAttachments.map(
                (file) => ({
                  id:
                    file.id ||
                    createId(),

                  name:
                    file.file_name ||
                    file.originalName ||
                    file.name ||
                    "Attachment",

                  type:
                    file.file_type ||
                    file.originalType ||
                    file.type ||
                    "",

                  kind:
                    file.kind ||
                    (
                      String(
                        file.file_type ||
                          file.originalType ||
                          file.type ||
                          ""
                      ).startsWith(
                        "image/"
                      )
                        ? "image"
                        : "document"
                    ),

                  text:
                    file.extracted_text ||
                    file.text ||
                    "",

                  extractionMethod:
                    file.extraction_method ||
                    null,

                  dataUrl:
                    file.file_url ||
                    file.dataUrl ||
                    null,

                  status:
                    "processed",
                })
              )

            return {
              id:
                message.id ||
                message._id ||
                createId(),

              role,

              content:
                message.content ||
                message.message ||
                "",

              model:
                message.model ||
                null,

              status:
                "completed",

              replyTo: null,

              createdAt:
                message.created_at ||
                message.createdAt ||
                Date.now(),

              attachments:
                normalizedAttachments,
            }
          }
        )

      let previousUserId =
        null

      const linkedMessages =
        normalizedMessages.map(
          (message) => {
            if (
              message.role ===
              "user"
            ) {
              previousUserId =
                message.id

              return message
            }

            return {
              ...message,
              replyTo:
                previousUserId,
            }
          }
        )

      setMessages(
        linkedMessages
      )

      setConversationId(
        actualConversationId
      )

      setAttachments([])
      setInput("")
      setGenerationState(
        "idle"
      )

      shouldAutoScrollRef.current =
        true

      setTimeout(() => {
        scrollToBottom()
        focusInput()
      }, 50)
    } catch (error) {
      console.error(
        "LOAD CONVERSATION ERROR:",
        error
      )

      alert(
        error?.message ||
          "Unable to load conversation."
      )
    } finally {
      setActiveConversationLoading(
        false
      )
    }
  }

  /* =======================================================
     PROCESS ONE ATTACHMENT
  ======================================================= */

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

    let uploadFile = file

    if (
      file.type.startsWith(
        "image/"
      )
    ) {
      uploadFile =
        await compressImage(
          file
        )
    }

    const formData =
      new FormData()

    formData.append(
      "file",
      uploadFile
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

          body: formData,
        }
      )

    let data = null

    try {
      data =
        await response.json()
    } catch {
      throw new Error(
        "Server returned an invalid upload response."
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
        `Invalid upload response for ${file.name}.`
      )
    }

    return {
      ...data.file,

      id:
        data.file.id ||
        createId(),

      name:
        data.file.name ||
        file.name,

      originalName:
        file.name,

      originalType:
        file.type,

      kind:
        data.file.kind ||
        (
          file.type.startsWith(
            "image/"
          )
            ? "image"
            : "document"
        ),
    }
  }

  /* =======================================================
     PROCESS ALL PENDING ATTACHMENTS
  ======================================================= */

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
      const processedFiles =
        []

      for (
        const attachment of pendingAttachments
      ) {
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

  /* =======================================================
     FILE SELECTION
  ======================================================= */

  function handleFileChange(
    event
  ) {
    const selectedFiles =
      Array.from(
        event.target.files ||
          []
      )

    event.target.value = ""

    if (!selectedFiles.length) {
      return
    }

    const availableSlots =
      3 - attachments.length

    if (
      availableSlots <= 0
    ) {
      alert(
        "You can attach maximum 3 files."
      )

      return
    }

    const filesToAdd =
      selectedFiles.slice(
        0,
        availableSlots
      )

    const validFiles =
      filesToAdd.filter(
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

    const stagedFiles =
      validFiles.map(
        (file) => ({
          id: createId(),

          name: file.name,

          type: file.type,

          size: file.size,

          kind:
            file.type.startsWith(
              "image/"
            )
              ? "image"
              : "document",

          file,

          status: "pending",

          text: "",

          dataUrl: null,
        })
      )

    setAttachments(
      (previous) =>
        [
          ...previous,
          ...stagedFiles,
        ].slice(0, 3)
    )

    focusInput()
  }

  function removeAttachment(
    index
  ) {
    if (uploading) {
      return
    }

    setAttachments(
      (previous) =>
        previous.filter(
          (_, itemIndex) =>
            itemIndex !== index
        )
    )
  }

  /* =======================================================
     SSE PARSER
  ======================================================= */

  function parseSSEEvent(
    eventText
  ) {
    const lines =
      eventText.split("\n")

    let eventName =
      "message"

    const dataLines = []

    for (const line of lines) {
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
    } catch {
      return {
        eventName,
        eventData: null,
      }
    }
  }

  /* =======================================================
     SEND TO AI
  ======================================================= */

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

    let responseCompleted =
      false

    try {
      const excludedIds =
        new Set(
          excludeMessageIds
        )

      const history =
        messages
          .filter(
            (message) =>
              !excludedIds.has(
                message.id
              )
          )
          .filter(
            (message) =>
              message.id !==
              assistantMessageId
          )
          .filter(
            (message) =>
              message.role ===
                "user" ||
              message.role ===
                "assistant"
          )
          .slice(-12)
          .map(
            (message) => ({
              role:
                message.role ===
                "assistant"
                  ? "assistant"
                  : "user",

              content:
                message.content ||
                "",
            })
          )

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

      const fastMode =
        selectedModel ===
        "openai/gpt-oss-20b"

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

                searchMode,

                deepMindMode,

                attachments:
                  cleanAttachments,

                conversationId:
                  conversationId ||
                  null,
              }),

            signal:
              controller.signal,
          }
        )

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
        } catch {}

        throw new Error(
          errorMessage
        )
      }

      const contentType =
        response.headers.get(
          "content-type"
        ) || ""

      /* =====================================================
         NON SSE RESPONSE
      ===================================================== */

      if (
        !contentType.includes(
          "text/event-stream"
        )
      ) {
        const data =
          await response.json()

        const newConversationId =
          data?.conversationId ||
          data?.conversation_id ||
          data?.conversation?.id ||
          null

        if (
          newConversationId
        ) {
          setConversationId(
            newConversationId
          )
        }

        const text =
          data?.text ||
          data?.message ||
          data?.response ||
          ""

        updateAssistant(
          assistantMessageId,
          () => ({
            content: text,

            status:
              text
                ? "completed"
                : "error",
          })
        )

        window.dispatchEvent(
          new CustomEvent(
            "klyro-conversations-refresh"
          )
        )

        activeGenerationRef.current =
          null

        setGenerationState(
          "idle"
        )

        responseCompleted =
          true

        focusInput()

        return
      }

      /* =====================================================
         SSE RESPONSE
      ===================================================== */

      if (!response.body) {
        throw new Error(
          "AI stream is unavailable."
        )
      }

      const reader =
        response.body.getReader()

      if (
        activeGenerationRef.current
      ) {
        activeGenerationRef.current.reader =
          reader
      }

      const decoder =
        new TextDecoder(
          "utf-8"
        )

      let buffer = ""

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

      const processEvent =
        (eventText) => {
          if (
            !eventText.trim()
          ) {
            return
          }

          if (
            controller.signal
              .aborted
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

          /* META */

          if (
            eventName ===
            "meta"
          ) {
            const newConversationId =
              eventData?.conversationId ||
              eventData?.conversation_id ||
              eventData?.id ||
              null

            if (
              newConversationId
            ) {
              setConversationId(
                newConversationId
              )
            }

            return
          }

          /* CHUNK */

          if (
            eventName ===
            "chunk"
          ) {
            const chunk =
              eventData?.text ||
              eventData?.content ||
              eventData?.chunk ||
              ""

            if (chunk) {
              streamedText +=
                chunk

              renderStreamText()
            }

            return
          }

          /* FINAL */

          if (
            eventName ===
            "final"
          ) {
            const finalText =
              eventData?.text ||
              eventData?.content ||
              ""

            const finalConversationId =
              eventData?.conversationId ||
              eventData?.conversation_id ||
              null

            if (
              finalConversationId
            ) {
              setConversationId(
                finalConversationId
              )
            }

            if (finalText) {
              streamedText =
                finalText

              renderStreamText(
                true
              )
            }

            updateAssistant(
              assistantMessageId,
              (message) => ({
                status:
                  "completed",

                content:
                  message.content ||
                  streamedText ||
                  "",
              })
            )

            responseCompleted =
              true

            receivedDone =
              true

            window.dispatchEvent(
              new CustomEvent(
                "klyro-conversations-refresh"
              )
            )

            return
          }

          /* ERROR */

          if (
            eventName ===
            "error"
          ) {
            throw new Error(
              eventData?.message ||
                eventData?.error ||
                "AI response failed."
            )
          }

          /* DONE */

          if (
            eventName ===
            "done"
          ) {
            receivedDone =
              true

            renderStreamText(
              true
            )

            updateAssistant(
              assistantMessageId,
              (message) => ({
                status:
                  "completed",

                content:
                  message.content ||
                  streamedText ||
                  "",
              })
            )

            responseCompleted =
              true

            window.dispatchEvent(
              new CustomEvent(
                "klyro-conversations-refresh"
              )
            )
          }
        }

      while (true) {
        if (
          controller.signal
            .aborted
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

        buffer +=
          decoder.decode(
            value,
            {
              stream: true,
            }
          )

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
          separatorIndex !==
          -1
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

          separatorIndex =
            buffer.indexOf(
              "\n\n"
            )
        }
      }

      /* Remaining decoder data */

      if (
        !controller.signal
          .aborted
      ) {
        buffer +=
          decoder.decode()

        if (buffer.trim()) {
          processEvent(buffer)
        }
      }

      renderStreamText(true)

      if (
        !receivedDone &&
        !responseCompleted &&
        streamedText
      ) {
        updateAssistant(
          assistantMessageId,
          (message) => ({
            status:
              "completed",

            content:
              message.content ||
              streamedText,
          })
        )

        responseCompleted =
          true
      }
    } catch (error) {
      if (
        error?.name ===
        "AbortError"
      ) {
        return
      }

      if (
        controller.signal
          .aborted
      ) {
        return
      }

      console.error(
        "KLYRO CHAT ERROR:",
        error
      )

      updateAssistant(
        assistantMessageId,
        (message) => ({
          status: "error",

          content:
            message.content ||
            error?.message ||
            "Something went wrong while generating the response.",
        })
      )
    } finally {
      if (
        streamRenderTimerRef.current
      ) {
        clearTimeout(
          streamRenderTimerRef.current
        )

        streamRenderTimerRef.current =
          null
      }

      if (
        activeGenerationRef.current
          ?.assistantMessageId ===
        assistantMessageId
      ) {
        activeGenerationRef.current =
          null
      }

      if (
        controller.signal
          .aborted
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

  /* =======================================================
     HANDLE SEND
  ======================================================= */

  async function handleSend(
    overrideText = null,
    overrideAttachments = null
  ) {
    if (
      generationState ===
      "generating"
    ) {
      return
    }

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
      overrideAttachments !== null
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

    const userMessage = {
      id: userMessageId,

      role: "user",

      content: displayText,

      attachments: files,

      createdAt: Date.now(),
    }

    const assistantMessage = {
      id: assistantMessageId,

      role: "assistant",

      content: "",

      status: "streaming",

      replyTo:
        userMessageId,

      createdAt: Date.now(),
    }

    setMessages(
      (previous) => [
        ...previous,
        userMessage,
        assistantMessage,
      ]
    )

    setInput("")
    setAttachments([])
    setModelMenuOpen(false)

    shouldAutoScrollRef.current =
      true

    try {
      let processedAttachments =
        files

      if (files.length) {
        processedAttachments =
          await processPendingAttachments(
            files
          )
      }

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
          status: "error",

          content:
            error?.message ||
            "KLYRO could not answer.",
        })
      )

      setGenerationState(
        "idle"
      )
    } finally {
      setUploading(false)
      focusInput()
    }
  }

  /* =======================================================
     PAUSE
  ======================================================= */

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
      (message) => ({
        status: "paused",

        content:
          message.content ||
          "",
      })
    )

    try {
      await active.reader?.cancel()
    } catch {}

    try {
      active.controller?.abort()
    } catch {}

    activeGenerationRef.current =
      null

    focusInput()
  }

  /* =======================================================
     REGENERATE
  ======================================================= */

  async function regenerateMessage(
    assistantMessage
  ) {
    if (
      generationState ===
      "generating"
    ) {
      return
    }

    const originalUser =
      messages.find(
        (message) =>
          message.id ===
          assistantMessage.replyTo
      )

    if (!originalUser) {
      return
    }

    const newAssistantId =
      createId()

    setMessages(
      (previous) => {
        const index =
          previous.findIndex(
            (message) =>
              message.id ===
              assistantMessage.id
          )

        if (index === -1) {
          return previous
        }

        const updated =
          [...previous]

        updated[index] = {
          ...updated[index],

          id: newAssistantId,

          content: "",

          status:
            "streaming",

          replyTo:
            originalUser.id,

          createdAt:
            Date.now(),
        }

        return updated
      }
    )

    try {
      await sendToAI({
        userText:
          originalUser.content,

        userMessageId:
          originalUser.id,

        assistantMessageId:
          newAssistantId,

        requestAttachments:
          originalUser.attachments ||
          [],

        excludeMessageIds: [
          assistantMessage.id,
        ],
      })
    } catch (error) {
      updateAssistant(
        newAssistantId,
        () => ({
          status: "error",

          content:
            error?.message ||
            "Unable to regenerate response.",
        })
      )

      setGenerationState(
        "idle"
      )
    }
  }

  /* =======================================================
     COPY
  ======================================================= */

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
        await navigator.clipboard.writeText(
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

  /* =======================================================
     KEYBOARD
  ======================================================= */

  function handleKeyDown(event) {
    if (
      event.key === "Enter" &&
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

  /* =======================================================
     NEW CHAT
  ======================================================= */

  async function newChat() {
    if (
      generationState ===
      "generating"
    ) {
      await pauseResponse()
    }

    setConversationId(null)
    setMessages([])
    setInput("")
    setAttachments([])
    setUploading(false)
    setGenerationState("idle")

    setSearchMode(false)
    setDeepMindMode(false)
    setModelMenuOpen(false)

    shouldAutoScrollRef.current =
      true

    focusInput()
  }

  /* =======================================================
     EVENT BRIDGE
  ======================================================= */

  useEffect(() => {
    function handleNewChat() {
      newChat()
    }

    async function handleConversationLoad(
      event
    ) {
      const conversation =
        event.detail?.conversation

      if (!conversation) {
        return
      }

      const selectedConversationId =
        conversation?.id ||
        conversation?._id

      if (!selectedConversationId) {
        return
      }

      await loadConversation(
        selectedConversationId,
        conversation
      )
    }

    function handleConversationDeleted(
      event
    ) {
      const deletedConversationId =
        event.detail?.conversationId

      if (
        conversationId !==
        deletedConversationId
      ) {
        return
      }

      setConversationId(null)
      setMessages([])
      setInput("")
      setAttachments([])
      setGenerationState(
        "idle"
      )

      activeGenerationRef.current =
        null

      shouldAutoScrollRef.current =
        true
    }

    window.addEventListener(
      "klyro-new-chat",
      handleNewChat
    )

    window.addEventListener(
      "klyro-conversation-load",
      handleConversationLoad
    )

    window.addEventListener(
      "klyro-conversation-deleted",
      handleConversationDeleted
    )

    return () => {
      window.removeEventListener(
        "klyro-new-chat",
        handleNewChat
      )

      window.removeEventListener(
        "klyro-conversation-load",
        handleConversationLoad
      )

      window.removeEventListener(
        "klyro-conversation-deleted",
        handleConversationDeleted
      )
    }
  }, [
    conversationId,
    generationState,
    uploading,
  ])

  /* =======================================================
     CURRENT MODEL
  ======================================================= */

  const currentModel =
    MODELS.find(
      (model) =>
        model.id ===
        selectedModel
    ) || MODELS[0]

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <section
      id="ask-klyro"
      className="
        relative
        min-h-[760px]
        overflow-hidden
        bg-[#070711]
        px-4
        py-16
        text-white
        sm:px-6
        lg:px-8
      "
    >
      {/* ===================================================
          BACKGROUND GLOW
      =================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-0
          h-[420px]
          w-[420px]
          -translate-x-1/2
          rounded-full
          bg-purple-600/[0.08]
          blur-[140px]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          bottom-0
          left-1/4
          h-64
          w-64
          rounded-full
          bg-cyan-500/[0.04]
          blur-[110px]
        "
      />

      <div
        className="
          relative
          mx-auto
          max-w-5xl
        "
      >
        {/* =================================================
            SECTION HEADER
        ================================================= */}

        <div
          className="
            mb-8
            text-center
          "
        >
          <div
            className="
              mb-3
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-purple-400/20
              bg-purple-500/10
              px-4
              py-2
              text-sm
              text-purple-200
            "
          >
            <span className="text-purple-300">
              ✦
            </span>

            Ask KLYRO
          </div>

          <h2
            className="
              text-3xl
              font-bold
              tracking-tight
              sm:text-4xl
            "
          >
            Your problem.

            <span
              className="
                bg-gradient-to-r
                from-purple-300
                via-fuchsia-300
                to-cyan-300
                bg-clip-text
                text-transparent
              "
            >
              {" "}
              Your next move.
            </span>
          </h2>

          <p
            className="
              mx-auto
              mt-3
              max-w-2xl
              text-sm
              leading-6
              text-slate-400
              sm:text-base
            "
          >
            Ask questions, solve problems,
            analyze files and understand
            screenshots directly inside KLYRO.
          </p>
        </div>

        {/* =================================================
            CHAT CARD
        ================================================= */}

        <div
          className="
            overflow-hidden
            rounded-[30px]
            border
            border-white/[0.09]
            bg-white/[0.025]
            shadow-2xl
            shadow-purple-950/30
            backdrop-blur-xl
          "
        >
          {/* =================================================
              TOP BAR
              
              New Chat removed.
              Model badge removed.
          ================================================= */}

          <div
            className="
              border-b
              border-white/[0.08]
              bg-white/[0.02]
              px-4
              py-3
              sm:px-5
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
                text-sm
                font-semibold
              "
            >
              <span
                className="
                  flex
                  h-6
                  w-6
                  items-center
                  justify-center
                  rounded-lg
                  bg-gradient-to-br
                  from-purple-500
                  to-cyan-500
                  text-[11px]
                  text-white
                  shadow-lg
                  shadow-purple-900/30
                "
              >
                ✦
              </span>

              KLYRO

              <span
                className="
                  ml-1
                  text-xs
                  font-normal
                  text-slate-600
                "
              >
                AI problem solving assistant
              </span>
            </div>
          </div>

          {/* =================================================
              CHAT AREA
          ================================================= */}

          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="
              h-[500px]
              overflow-y-auto
              px-4
              py-5
              sm:h-[540px]
              sm:px-6
            "
          >
            {/* LOADING */}

            {activeConversationLoading && (
              <div
                className="
                  mb-4
                  flex
                  justify-center
                "
              >
                <div
                  className="
                    rounded-xl
                    border
                    border-white/10
                    bg-white/5
                    px-3
                    py-2
                    text-xs
                    text-slate-500
                  "
                >
                  Loading conversation...
                </div>
              </div>
            )}

            {/* EMPTY STATE */}

            {!messages.length &&
              !activeConversationLoading && (
                <div
                  className="
                    flex
                    h-full
                    items-center
                    justify-center
                  "
                >
                  <div
                    className="
                      max-w-md
                      text-center
                    "
                  >
                    <div
                      className="
                        mx-auto
                        mb-5
                        flex
                        h-16
                        w-16
                        items-center
                        justify-center
                        rounded-2xl
                        border
                        border-purple-400/20
                        bg-gradient-to-br
                        from-purple-500/15
                        to-cyan-500/10
                        text-2xl
                      "
                    >
                      ✦
                    </div>

                    <h3
                      className="
                        text-lg
                        font-semibold
                        text-white
                      "
                    >
                      Ask KLYRO anything
                    </h3>

                    <p
                      className="
                        mt-2
                        text-sm
                        leading-6
                        text-slate-500
                      "
                    >
                      Ask a question, upload
                      a resume, PDF or
                      screenshot, and KLYRO
                      will work on it.
                    </p>
                  </div>
                </div>
              )}

            {/* MESSAGES */}

            <div className="space-y-7">
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
                            ? "max-w-[88%] sm:max-w-[76%]"
                            : "w-full max-w-[94%] sm:max-w-[88%]"
                        }
                      >
                        {/* MESSAGE */}

                        <div
                          className={
                            isUser
                              ? `
                                rounded-2xl
                                rounded-br-md
                                border
                                border-purple-400/20
                                bg-purple-500/10
                                px-4
                                py-3
                                text-sm
                                leading-6
                                text-slate-100
                              `
                              : `
                                text-sm
                                leading-7
                                text-slate-200
                              `
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

                              {/* USER ATTACHMENTS */}

                              {message.attachments
                                ?.length >
                                0 && (
                                <div
                                  className="
                                    mt-3
                                    flex
                                    flex-wrap
                                    gap-2
                                  "
                                >
                                  {message.attachments.map(
                                    (
                                      file,
                                      index
                                    ) => (
                                      <div
                                        key={`${file.name}-${index}`}
                                        className="
                                          flex
                                          items-center
                                          gap-2
                                          rounded-xl
                                          border
                                          border-white/10
                                          bg-white/5
                                          px-3
                                          py-2
                                          text-xs
                                          text-slate-300
                                        "
                                      >
                                        <span>
                                          {file.kind ===
                                          "image"
                                            ? "🖼️"
                                            : "📄"}
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
                            /* ASSISTANT */

                            <div
                              className="
                                prose
                                prose-invert
                                max-w-none
                                prose-headings:text-white
                                prose-p:text-slate-200
                                prose-li:text-slate-200
                                prose-strong:text-white
                                prose-a:text-cyan-300
                                prose-code:text-purple-200
                                prose-pre:border
                                prose-pre:border-white/10
                                prose-pre:bg-black/30
                              "
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
                                >
                                  {
                                    message.content
                                  }
                                </ReactMarkdown>
                              ) : (
                                <div
                                  className="
                                    flex
                                    items-center
                                    gap-1.5
                                  "
                                >
                                  <span
                                    className="
                                      h-1.5
                                      w-1.5
                                      animate-pulse
                                      rounded-full
                                      bg-purple-400
                                    "
                                  />

                                  <span
                                    className="
                                      h-1.5
                                      w-1.5
                                      animate-pulse
                                      rounded-full
                                      bg-purple-400
                                      [animation-delay:150ms]
                                    "
                                  />

                                  <span
                                    className="
                                      h-1.5
                                      w-1.5
                                      animate-pulse
                                      rounded-full
                                      bg-purple-400
                                      [animation-delay:300ms]
                                    "
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* PAUSED */}

                          {!isUser &&
                            message.status ===
                              "paused" && (
                              <div
                                className="
                                  mt-3
                                  rounded-lg
                                  border
                                  border-yellow-400/10
                                  bg-yellow-400/5
                                  px-3
                                  py-2
                                  text-xs
                                  text-yellow-200/70
                                "
                              >
                                Response paused.
                              </div>
                            )}

                          {/* ERROR */}

                          {!isUser &&
                            message.status ===
                              "error" && (
                              <div
                                className="
                                  mt-3
                                  rounded-lg
                                  border
                                  border-red-400/10
                                  bg-red-400/5
                                  px-3
                                  py-2
                                  text-xs
                                  text-red-200/80
                                "
                              >
                                {message.content ||
                                  "Response could not be completed."}
                              </div>
                            )}
                        </div>

                        {/* ASSISTANT ACTIONS */}

                        {!isUser &&
                          message.content && (
                            <div
                              className="
                                mt-3
                                flex
                                items-center
                                gap-2
                              "
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  copyResponse(
                                    message.content,
                                    message.id
                                  )
                                }
                                className="
                                  rounded-lg
                                  border
                                  border-white/10
                                  bg-white/5
                                  px-3
                                  py-1.5
                                  text-xs
                                  text-slate-400
                                  transition
                                  hover:bg-white/10
                                  hover:text-slate-200
                                "
                              >
                                {copiedMessageId ===
                                message.id
                                  ? "Copied"
                                  : "Copy"}
                              </button>

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
                                className="
                                  rounded-lg
                                  border
                                  border-white/10
                                  bg-white/5
                                  px-3
                                  py-1.5
                                  text-xs
                                  text-slate-400
                                  transition
                                  hover:bg-white/10
                                  hover:text-slate-200
                                  disabled:cursor-not-allowed
                                  disabled:opacity-40
                                "
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

          {/* =================================================
              COMPOSER
              
              IMPORTANT:
              No collapse/expand state.
              Controls permanently visible.
          ================================================= */}

          <div
            className="
              border-t
              border-white/10
              bg-black/20
              p-3
              sm:p-4
            "
          >
            {/* =================================================
                ATTACHMENT PREVIEW
            ================================================= */}

            {attachments.length >
              0 && (
              <div
                className="
                  mb-3
                  flex
                  flex-wrap
                  gap-2
                "
              >
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
                      className="
                        flex
                        items-center
                        gap-2
                        rounded-2xl
                        border
                        border-white/10
                        bg-white/[0.045]
                        px-3
                        py-2
                      "
                    >
                      <div
                        className="
                          flex
                          h-8
                          w-8
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          bg-purple-500/10
                        "
                      >
                        {file.kind ===
                        "image"
                          ? "🖼️"
                          : "📄"}
                      </div>

                      <div className="min-w-0">
                        <div
                          className="
                            max-w-[170px]
                            truncate
                            text-xs
                            text-slate-200
                          "
                        >
                          {
                            file.name
                          }
                        </div>

                        <div
                          className="
                            text-[10px]
                            text-slate-600
                          "
                        >
                          Ready to analyze
                        </div>
                      </div>

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
                        className="
                          flex
                          h-6
                          w-6
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          text-slate-600
                          transition
                          hover:bg-white/10
                          hover:text-white
                          disabled:opacity-30
                        "
                        aria-label={`Remove ${file.name}`}
                      >
                        ×
                      </button>
                    </div>
                  )
                )}
              </div>
            )}

            {/* =================================================
                MAIN COMPOSER
            ================================================= */}

            <div
              className="
                relative
                overflow-visible
                rounded-[26px]
                border
                border-purple-400/20
                bg-[#090910]
                shadow-[0_0_0_1px_rgba(168,85,247,0.04),0_25px_80px_rgba(0,0,0,0.35)]
              "
            >
              {/* TOP GRADIENT LINE */}

              <div
                className="
                  pointer-events-none
                  absolute
                  inset-x-8
                  top-0
                  h-px
                  bg-gradient-to-r
                  from-transparent
                  via-purple-400/40
                  to-transparent
                "
              />

              {/* =================================================
                  TEXTAREA
              ================================================= */}

              <div
                className="
                  px-4
                  pt-4
                  sm:px-5
                  sm:pt-5
                "
              >
                <textarea
                  ref={
                    textareaRef
                  }
                  value={input}
                  onChange={(event) =>
                    setInput(
                      event.target
                        .value
                    )
                  }
                  onKeyDown={
                    handleKeyDown
                  }
                  rows={2}
                  disabled={uploading}
                  placeholder={
                    uploading
                      ? "Reading your file..."
                      : generationState ===
                          "paused"
                        ? "Ask KLYRO again..."
                        : "Ask KLYRO anything..."
                  }
                  className="
                    block
                    min-h-[58px]
                    max-h-[180px]
                    w-full
                    resize-none
                    overflow-y-auto
                    bg-transparent
                    text-[15px]
                    leading-6
                    text-white
                    outline-none
                    placeholder:text-slate-600
                    disabled:cursor-not-allowed
                  "
                />
              </div>

              {/* =================================================
                  PERMANENT AI CONTROLS
              ================================================= */}

              <div
                className="
                  px-4
                  pb-3
                  sm:px-5
                "
              >
                <div
                  className="
                    flex
                    flex-wrap
                    gap-2
                  "
                >
                  {/* SEARCH */}

                  <button
                    type="button"
                    disabled={
                      generationState ===
                      "generating"
                    }
                    onClick={() =>
                      setSearchMode(
                        (value) =>
                          !value
                      )
                    }
                    className={`
                      flex
                      items-center
                      gap-2
                      rounded-xl
                      border
                      px-3
                      py-2
                      text-xs
                      font-medium
                      transition-all
                      ${
                        searchMode
                          ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                          : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                      }
                    `}
                  >
                    <span className="text-sm">
                      ⌕
                    </span>

                    Search

                    {searchMode && (
                      <span
                        className="
                          h-1.5
                          w-1.5
                          rounded-full
                          bg-cyan-300
                        "
                      />
                    )}
                  </button>

                  {/* DEEP MIND */}

                  <button
                    type="button"
                    disabled={
                      generationState ===
                      "generating"
                    }
                    onClick={() =>
                      setDeepMindMode(
                        (value) =>
                          !value
                      )
                    }
                    className={`
                      flex
                      items-center
                      gap-2
                      rounded-xl
                      border
                      px-3
                      py-2
                      text-xs
                      font-medium
                      transition-all
                      ${
                        deepMindMode
                          ? "border-purple-400/30 bg-purple-400/10 text-purple-200"
                          : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                      }
                    `}
                  >
                    <span>
                      ✦
                    </span>

                    Deep Mind

                    {deepMindMode && (
                      <span
                        className="
                          h-1.5
                          w-1.5
                          rounded-full
                          bg-purple-300
                        "
                      />
                    )}
                  </button>

                  {/* ATTACH */}

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
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-xl
                      border
                      border-white/10
                      bg-white/5
                      px-3
                      py-2
                      text-xs
                      text-slate-400
                      transition
                      hover:bg-white/10
                      hover:text-slate-200
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                  >
                    <span>
                      +
                    </span>

                    Attach
                  </button>

                  {/* =================================================
                      MODEL SELECTOR
                  ================================================= */}

                  <div className="relative">
                    <button
                      type="button"
                      disabled={
                        generationState ===
                        "generating"
                      }
                      onClick={() =>
                        setModelMenuOpen(
                          (value) =>
                            !value
                        )
                      }
                      className="
                        flex
                        items-center
                        gap-2
                        rounded-xl
                        border
                        border-white/10
                        bg-white/5
                        px-3
                        py-2
                        text-xs
                        text-slate-300
                        transition
                        hover:bg-white/10
                        disabled:opacity-40
                      "
                    >
                      <span
                        className="
                          text-purple-300
                        "
                      >
                        ✦
                      </span>

                      <span>
                        {
                          currentModel.name
                        }
                      </span>

                      <span
                        className="
                          text-slate-600
                        "
                      >
                        ▾
                      </span>
                    </button>

                    {/* MODEL DROPDOWN */}

                    {modelMenuOpen && (
                      <div
                        className="
                          absolute
                          bottom-full
                          left-0
                          z-[70]
                          mb-2
                          w-[290px]
                          overflow-hidden
                          rounded-2xl
                          border
                          border-white/10
                          bg-[#0d0d16]/95
                          p-1.5
                          shadow-2xl
                          shadow-black/50
                          backdrop-blur-xl
                        "
                      >
                        <div
                          className="
                            px-3
                            py-2
                            text-[10px]
                            uppercase
                            tracking-[0.16em]
                            text-slate-600
                          "
                        >
                          Choose model
                        </div>

                        {MODELS.map(
                          (model) => (
                            <button
                              key={
                                model.id
                              }
                              type="button"
                              onClick={() => {
                                setSelectedModel(
                                  model.id
                                )

                                setModelMenuOpen(
                                  false
                                )
                              }}
                              className={`
                                flex
                                w-full
                                items-start
                                gap-3
                                rounded-xl
                                px-3
                                py-3
                                text-left
                                transition
                                ${
                                  selectedModel ===
                                  model.id
                                    ? "bg-purple-500/10"
                                    : "hover:bg-white/5"
                                }
                              `}
                            >
                              <div
                                className="
                                  flex
                                  h-8
                                  w-8
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-lg
                                  border
                                  border-white/10
                                  bg-white/5
                                  text-xs
                                  text-purple-300
                                "
                              >
                                ✦
                              </div>

                              <div className="min-w-0 flex-1">
                                <div
                                  className="
                                    text-xs
                                    font-semibold
                                    text-slate-200
                                  "
                                >
                                  {
                                    model.name
                                  }
                                </div>

                                <div
                                  className="
                                    mt-1
                                    text-[10px]
                                    leading-4
                                    text-slate-600
                                  "
                                >
                                  {
                                    model.description
                                  }
                                </div>
                              </div>

                              {selectedModel ===
                                model.id && (
                                <span
                                  className="
                                    ml-auto
                                    pt-0.5
                                    text-purple-300
                                  "
                                >
                                  ✓
                                </span>
                              )}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* =================================================
                  BOTTOM CONTROLS
              ================================================= */}

              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                  border-t
                  border-white/[0.06]
                  px-3
                  py-3
                  sm:px-4
                "
              >
                <div
                  className="
                    flex
                    min-w-0
                    items-center
                    gap-2
                  "
                >
                  {/* HIDDEN FILE INPUT */}

                  <input
                    ref={
                      fileInputRef
                    }
                    type="file"
                    hidden
                    multiple
                    accept="
                      .pdf,
                      .docx,
                      .txt,
                      .md,
                      .csv,
                      .xlsx,
                      .xls,
                      .png,
                      .jpg,
                      .jpeg,
                      .webp
                    "
                    onChange={
                      handleFileChange
                    }
                  />

                  {/* PLUS BUTTON */}

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
                    className="
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-white/10
                      bg-white/5
                      text-lg
                      text-slate-400
                      transition
                      hover:bg-white/10
                      hover:text-white
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                    aria-label="Attach file"
                  >
                    +
                  </button>

                  {/* ACTIVE MODE INDICATORS */}

                  <div
                    className="
                      hidden
                      items-center
                      gap-1.5
                      sm:flex
                    "
                  >
                    {searchMode && (
                      <span
                        className="
                          rounded-lg
                          border
                          border-cyan-400/10
                          bg-cyan-400/5
                          px-2
                          py-1
                          text-[10px]
                          text-cyan-300
                        "
                      >
                        Search
                      </span>
                    )}

                    {deepMindMode && (
                      <span
                        className="
                          rounded-lg
                          border
                          border-purple-400/10
                          bg-purple-400/5
                          px-2
                          py-1
                          text-[10px]
                          text-purple-300
                        "
                      >
                        Deep Mind
                      </span>
                    )}
                  </div>
                </div>

                {/* =================================================
                    PAUSE / SEND
                ================================================= */}

                {generationState ===
                "generating" ? (
                  <button
                    type="button"
                    onClick={
                      pauseResponse
                    }
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-xl
                      border
                      border-yellow-400/20
                      bg-yellow-400/10
                      px-4
                      py-2.5
                      text-xs
                      font-semibold
                      text-yellow-200
                      transition
                      hover:bg-yellow-400/15
                    "
                  >
                    <span
                      className="
                        h-2
                        w-2
                        rounded-sm
                        bg-yellow-300
                      "
                    />

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
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-xl
                      bg-gradient-to-r
                      from-purple-500
                      via-fuchsia-500
                      to-cyan-500
                      px-4
                      py-2.5
                      text-xs
                      font-semibold
                      text-white
                      shadow-lg
                      shadow-purple-950/30
                      transition
                      hover:scale-[1.02]
                      active:scale-95
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                  >
                    {uploading
                      ? "Reading..."
                      : "Send"}

                    {!uploading && (
                      <span>
                        ↗
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* =================================================
                COMPOSER FOOTER STATUS
            ================================================= */}

            <div
              className="
                mt-2
                flex
                items-center
                justify-between
                px-1
                text-[11px]
                text-slate-600
              "
            >
              <span>
                Enter to send · Shift + Enter
                for new line
              </span>

              {uploading && (
                <span
                  className="
                    text-purple-400/70
                  "
                >
                  Reading your file...
                </span>
              )}

              {!uploading &&
                generationState ===
                  "generating" && (
                  <span
                    className="
                      text-yellow-500/70
                    "
                  >
                    KLYRO is working...
                  </span>
                )}

              {!uploading &&
                generationState ===
                  "paused" && (
                  <span
                    className="
                      text-yellow-500/70
                    "
                  >
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