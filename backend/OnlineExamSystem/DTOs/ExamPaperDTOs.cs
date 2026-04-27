using OnlineExamSystem.Models;

namespace OnlineExamSystem.DTOs;

public record QuestionRequirement(
    QuestionType Type,
    DifficultyLevel Difficulty,
    int Count,
    int ScorePerQuestion
);

public record AutoGeneratePaperRequest(
    string Name,
    string? Description,
    int Duration,
    int PassingScore,
    bool ShuffleQuestions,
    bool ShuffleOptions,
    DateTime StartTime,
    DateTime EndTime,
    IEnumerable<QuestionRequirement> QuestionRequirements,
    int TotalScore
);

public record ManualPaperRequest(
    string Name,
    string? Description,
    int Duration,
    int PassingScore,
    bool ShuffleQuestions,
    bool ShuffleOptions,
    DateTime StartTime,
    DateTime EndTime,
    IEnumerable<int> QuestionIds
);

public record ExamQuestionDTO(
    int Id,
    int ExamPaperId,
    int QuestionId,
    int QuestionOrder,
    QuestionDTO Question
);

public record ExamPaperDTO(
    int Id,
    string Name,
    string? Description,
    int TotalScore,
    int PassingScore,
    int Duration,
    bool ShuffleQuestions,
    bool ShuffleOptions,
    DateTime StartTime,
    DateTime EndTime,
    int CreatedBy,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    IEnumerable<ExamQuestionDTO> ExamQuestions
);
