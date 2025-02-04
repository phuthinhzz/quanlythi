const Answer = require("../models/Answer");
const Question = require("../models/Question");
const Quiz = require("../models/Quiz");

exports.saveAnswer = async (req, res) => {
    const { questionId, selectedOption, timeSpent } = req.body;
    const id = req.params.id; // Đảm bảo quizId được truyền trong URL

    try {
        const userId = req.user.id;  // Giả sử bạn có thông tin userId từ auth

        // Kiểm tra xem câu hỏi có tồn tại không
        const question = await Question.findById(questionId);
        console.log("question", question)
        if (!question) {
            return res.status(400).json({ message: "Question not found" });
        }

        // Kiểm tra xem quiz có tồn tại không
        const quiz = await Quiz.findById(id);
        if (!quiz) {
            return res.status(400).json({ message: "Quiz not found" });
        }

        // Kiểm tra xem lựa chọn của người dùng có đúng không
        const selectedOptionObject = question.options.find(option => option.text === selectedOption);

        if (!selectedOptionObject) {
            return res.status(400).json({ message: "Selected option not found in question options" });
        }

        const isCorrect = selectedOptionObject.isCorrect; // Lấy giá trị `isCorrect` từ `options`

        console.log("selectedOptionObject", selectedOptionObject);
        console.log("isCorrect", isCorrect);

        // Kiểm tra xem câu trả lời đã tồn tại chưa
        let answer = await Answer.findOne({ userId, quizId: id, questionId });

        if (answer) {
            // Nếu câu trả lời đã tồn tại, cập nhật lại đáp án và isCorrect
            answer.selectedOption = selectedOption;
            answer.isCorrect = isCorrect;  // Cập nhật lại isCorrect
            answer.timeSpent = timeSpent;
            answer.changeCount += 1;  // Tăng số lần thay đổi

            // Lưu lại câu trả lời đã cập nhật
            await answer.save();
        } else {
            // Nếu câu trả lời chưa tồn tại, tạo mới
            answer = new Answer({
                userId,
                quizId: id,
                questionId,
                selectedOption,
                isCorrect,
                timeSpent,
            });

            // Lưu câu trả lời mới vào cơ sở dữ liệu
            await answer.save();
        }

        // Trả về phản hồi thành công
        res.status(200).json({ message: "Answer saved successfully", answer });
    } catch (error) {
        console.error("Error saving answer:", error);
        res.status(500).json({ message: "Failed to save answer", error: error.message });
    }
};




