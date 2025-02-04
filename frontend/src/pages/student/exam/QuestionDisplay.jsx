import React from "react";

const QuestionDisplay = ({ question, selectedOption, onSelectOption }) => {
  if (!question) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Question Header */}
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center justify-center w-6 h-6 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
              Q
            </span>
            <h2 className="text-lg font-medium text-gray-900">Question</h2>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <svg
                className="h-4 w-4 text-gray-400 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              {question.points} pts
            </div>
            <div className="flex items-center">
              <svg
                className="h-4 w-4 text-gray-400 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {question.timeLimit}s
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="p-6">
        <p className="text-gray-900 text-lg mb-8">{question.text}</p>

        {/* Options */}
        <div className="space-y-4">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => onSelectOption(question._id, option.text)}
              className={`group w-full text-left focus:outline-none ${
                selectedOption === option.text
                  ? "ring-2 ring-blue-500"
                  : "hover:bg-gray-50"
              }`}
            >
              <div
                className={`relative flex items-center p-4 rounded-lg border-2 transition-all ${
                  selectedOption === option.text
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 group-hover:border-gray-300"
                }`}
              >
                {/* Radio Button */}
                <div className="flex-shrink-0">
                  <div
                    className={`w-5 h-5 rounded-full border-2 transition-colors ${
                      selectedOption === option.text
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300 group-hover:border-gray-400"
                    }`}
                  >
                    {selectedOption === option.text && (
                      <div className="w-full h-full rounded-full bg-white scale-[0.4]" />
                    )}
                  </div>
                </div>

                {/* Option Text */}
                <span
                  className={`ml-3 font-medium ${
                    selectedOption === option.text
                      ? "text-blue-900"
                      : "text-gray-900 group-hover:text-gray-900"
                  }`}
                >
                  {option.text}
                </span>

                {/* Selected Indicator */}
                {selectedOption === option.text && (
                  <span className="absolute inset-y-0 right-4 flex items-center">
                    <svg
                      className="h-5 w-5 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestionDisplay;
