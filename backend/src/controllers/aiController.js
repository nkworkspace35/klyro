const { GoogleGenAI } =
  require("@google/genai")

const pool =
  require("../config/db")


const ai = new GoogleGenAI({
  apiKey:
    process.env.GEMINI_API_KEY,
})


const testAI = async (
  req,
  res
) => {
  try {
    const response =
      await ai.models.generateContent({
        model:
          "gemini-3.8-flash",

        contents:
          "Say hello to KLYRO in one short sentence.",
      })

    res.json({
      success: true,
      message:
        "Gemini AI connected successfully",
      answer:
        response.text,
    })
  } catch (error) {
    console.error(
      "Gemini AI error:",
      error
    )

    res.status(500).json({
      success: false,
      message:
        "Gemini AI request failed",
    })
  }
}


const solveProblem = async (
  req,
  res
) => {
  try {
    const { problemId } =
      req.body

    if (!problemId) {
      return res.status(400).json({
        success: false,
        message:
          "Problem ID is required",
      })
    }

    const userId =
      req.user.userId


    const problemResult =
      await pool.query(
        `SELECT
           id,
           user_id,
           title,
           description
         FROM problems
         WHERE id = $1
         AND user_id = $2`,
        [
          problemId,
          userId,
        ]
      )


    if (
      problemResult.rows
        .length === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Problem not found",
      })
    }


    const currentProblem =
      problemResult.rows[0]

    const problem =
      currentProblem.description


    await pool.query(
      `UPDATE problems
       SET
         ai_status = 'pending',
         updated_at = NOW()
       WHERE id = $1
       AND user_id = $2`,
      [
        problemId,
        userId,
      ]
    )


    const prompt = `
You are KLYRO, an AI-powered problem-solving assistant.

Your job is to help a person understand their real-life problem and figure out practical next steps.

PROBLEM TITLE:
${currentProblem.title}

USER'S PROBLEM:
${problem.trim()}

Analyze the problem carefully.

Return ONLY valid JSON.

Do not add markdown.
Do not add code fences.
Do not add any text before or after the JSON.

The JSON must follow exactly this structure:

{
  "what_is_happening": "Explain what is happening in simple language.",
  "why_this_may_be_happening": [
    "Possible reason 1",
    "Possible reason 2",
    "Possible reason 3"
  ],
  "what_to_do_next": [
    "Immediate action 1",
    "Immediate action 2",
    "Immediate action 3"
  ],
  "action_plan": [
    {
      "step": 1,
      "title": "Step title",
      "description": "Explain what the user should do."
    },
    {
      "step": 2,
      "title": "Step title",
      "description": "Explain what the user should do."
    },
    {
      "step": 3,
      "title": "Step title",
      "description": "Explain what the user should do."
    }
  ],
  "what_to_avoid": [
    "Thing to avoid 1",
    "Thing to avoid 2"
  ],
  "summary": "Give a short practical summary of the situation and the user's next move."
}

IMPORTANT RULES:

1. Use simple language.
2. Be practical and specific.
3. Do not give generic motivational advice.
4. Do not invent facts about the user's situation.
5. If information is missing, clearly mention that in the response.
6. For medical, legal, financial, or other high-risk matters, recommend consulting an appropriate qualified professional.
7. The action plan should contain realistic steps.
8. Keep the response useful but not unnecessarily long.
9. Return valid JSON only.
10. The action_plan must contain 3 to 7 useful steps.
`


    const response =
      await ai.models.generateContent({
        model:
          "gemini-3.8-flash",

        contents:
          prompt,
      })


    const rawText =
      response.text


    if (!rawText) {
      throw new Error(
        "Gemini returned an empty response"
      )
    }


    let cleanedText =
      rawText.trim()


    if (
      cleanedText.startsWith(
        "```json"
      )
    ) {
      cleanedText =
        cleanedText
          .replace(
            /^```json\s*/,
            ""
          )
          .replace(
            /\s*```$/,
            ""
          )
          .trim()
    } else if (
      cleanedText.startsWith(
        "```"
      )
    ) {
      cleanedText =
        cleanedText
          .replace(
            /^```\s*/,
            ""
          )
          .replace(
            /\s*```$/,
            ""
          )
          .trim()
    }


    let aiSolution


    try {
      aiSolution =
        JSON.parse(
          cleanedText
        )
    } catch (
      parseError
    ) {
      console.error(
        "Gemini JSON parse error:",
        parseError
      )

      console.error(
        "Gemini raw response:",
        rawText
      )


      await pool.query(
        `UPDATE problems
         SET
           ai_status = 'failed',
           updated_at = NOW()
         WHERE id = $1
         AND user_id = $2`,
        [
          problemId,
          userId,
        ]
      )


      return res.status(500).json({
        success: false,
        message:
          "KLYRO received an invalid AI response",
      })
    }


    if (
      !Array.isArray(
        aiSolution.action_plan
      )
    ) {
      aiSolution.action_plan =
        []
    }


    await pool.query(
      `DELETE FROM problem_actions
       WHERE problem_id = $1`,
      [problemId]
    )


    for (
      let index = 0;
      index <
        aiSolution.action_plan
          .length;
      index++
    ) {
      const action =
        aiSolution
          .action_plan[index]


      const stepNumber =
        Number(
          action.step
        ) ||
        index + 1


      const title =
        action.title ||
        `Step ${stepNumber}`


      const description =
        action.description ||
        ""


      if (
        !description.trim()
      ) {
        continue
      }


      await pool.query(
        `INSERT INTO problem_actions
         (
           problem_id,
           step_number,
           title,
           description,
           completed
         )
         VALUES
         ($1, $2, $3, $4, FALSE)`,
        [
          problemId,
          stepNumber,
          title.trim(),
          description.trim(),
        ]
      )
    }


    const updateResult =
      await pool.query(
        `UPDATE problems
         SET
           ai_response = $1,
           ai_solution = $2::jsonb,
           ai_status = 'completed',
           updated_at = NOW()
         WHERE id = $3
         AND user_id = $4
         RETURNING
           id,
           user_id,
           title,
           description,
           status,
           ai_response,
           ai_solution,
           ai_status,
           created_at,
           updated_at`,
        [
          JSON.stringify(
            aiSolution
          ),
          JSON.stringify(
            aiSolution
          ),
          problemId,
          userId,
        ]
      )


    const actionsResult =
      await pool.query(
        `SELECT
           id,
           problem_id,
           step_number,
           title,
           description,
           completed,
           created_at,
           updated_at
         FROM problem_actions
         WHERE problem_id = $1
         ORDER BY step_number ASC`,
        [problemId]
      )


    const savedProblem =
      updateResult.rows[0]

    savedProblem.actions =
      actionsResult.rows


    res.json({
      success: true,
      message:
        "KLYRO AI generated and saved the solution",
      answer:
        JSON.stringify(
          aiSolution
        ),
      solution:
        aiSolution,
      problem:
        savedProblem,
    })

  } catch (error) {
    console.error(
      "KLYRO AI solve error:",
      error
    )


    res.status(500).json({
      success: false,
      message:
        "Unable to generate AI solution",
    })
  }
}


module.exports = {
  testAI,
  solveProblem,
}