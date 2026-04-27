using OnlineExamSystem.Models;

namespace OnlineExamSystem.DTOs;

public record SubmitAnswerRequest(
    int QuestionId,
    string StudentAnswer
);

public record GradeAnswerRequest(
    int Score,
    string? Comment
);

public record ExamAnswerDTO(
    int Id,
    int ExamSessionId,
    int QuestionId,
    string StudentAnswer,
    bool? IsCorrect,
    int? TeacherScore,
    string? TeacherComment,
    DateTime AnsweredAt,
    QuestionDTO? Question
);

public record ExamSessionDTO(
    int Id,
    int ExamPaperId,
    int StudentId,
    DateTime StartTime,
    DateTime? EndTime,
    ExamSessionStatus Status,
    int ScreenSwitchCount,
    ExamPaperDTO ExamPaper
);

public record ExamResultDTO(
    int Id,
    int ExamSessionId,
    int StudentId,
    int ExamPaperId,
    int TotalScore,
    int AutoScore,
    int? TeacherScore,
    bool IsPassed,
    DateTime SubmittedAt,
    DateTime? GradedAt,
    ExamPaperDTO? ExamPaper,
    UserDTO? Student
);

public record QuestionStatDTO(
    int QuestionId,
    string QuestionContent,
    int TotalAttempts,
    int CorrectCount,
    double CorrectRate,
    double Discrimination
);

public record TagStatDTO(
    string Tag,
    int TotalQuestions,
    double CorrectRate
);

public record ScoreDistributionDTO(
    string Range,
    int Count
);

public record ExamStatsDTO(
    double AvgScore,
    int MaxScore,
    int MinScore,
    int TotalStudents,
    IEnumerable<ScoreDistributionDTO> ScoreDistribution,
    IEnumerable<QuestionStatDTO> QuestionStats,
    IEnumerable<TagStatDTO> TagStats
);
