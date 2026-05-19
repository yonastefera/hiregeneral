import { ShieldQuestion, Trash2 } from "lucide-react";

import { PostJobSection } from "./PostJobSection";
import { inputClassName, type ScreeningQuestion } from "./post-job-content";

type ScreeningQuestionsSectionProps = {
  questions: ScreeningQuestion[];
  onQuestionsChange: (questions: ScreeningQuestion[]) => void;
};

function createQuestion(): ScreeningQuestion {
  return {
    id: crypto.randomUUID(),
    question: "",
    required: true,
  };
}

export function ScreeningQuestionsSection({
  questions,
  onQuestionsChange,
}: ScreeningQuestionsSectionProps) {
  const addQuestion = () => onQuestionsChange([...questions, createQuestion()]);
  const updateQuestion = (
    id: string,
    patch: Partial<Omit<ScreeningQuestion, "id">>,
  ) => {
    onQuestionsChange(
      questions.map((question) =>
        question.id === id ? { ...question, ...patch } : question,
      ),
    );
  };
  const removeQuestion = (id: string) => {
    onQuestionsChange(questions.filter((question) => question.id !== id));
  };

  return (
    <PostJobSection title="Screening questions" icon={ShieldQuestion}>
      <div className="space-y-2">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-3"
          >
            <div className="flex items-start gap-2">
              <input
                value={question.question}
                onChange={(event) =>
                  updateQuestion(question.id, { question: event.target.value })
                }
                placeholder={`Question ${index + 1}, e.g. Are you authorized to work in the US?`}
                className={`${inputClassName} bg-white`}
              />

              <button
                type="button"
                onClick={() => removeQuestion(question.id)}
                aria-label="Remove screening question"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-neutral-400 transition hover:bg-white hover:text-rose-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <label className="mt-2 flex items-center gap-2 text-[12px] font-medium text-neutral-600">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(event) =>
                  updateQuestion(question.id, {
                    required: event.target.checked,
                  })
                }
                className="h-3.5 w-3.5 rounded text-emerald-500"
              />
              Required before applying
            </label>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addQuestion}
        className="mt-3 rounded-lg bg-neutral-100 px-3.5 py-2 text-[12px] font-semibold text-neutral-700 transition hover:bg-neutral-200/70"
      >
        Add screening question
      </button>
    </PostJobSection>
  );
}
