using OnlineExamSystem.Models;

namespace OnlineExamSystem.DTOs;

public record QuestionOptionDTO(
    int Id,
    string Text,
    bool? IsCorrect
);

public record QuestionDTO(
    int Id,
    QuestionType Type,
    string Content,
    string? ImageUrl,
    IEnumerable<QuestionOptionDTO> Options,
    string CorrectAnswer,
    int Score,
    DifficultyLevel Difficulty,
    IEnumerable<string> Tags,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record CreateQuestionRequest(
    QuestionType Type,
    string Content,
    string? ImageUrl,
    IEnumerable<QuestionOptionDTO> Options,
    string CorrectAnswer,
    int Score,
    DifficultyLevel Difficulty,
    IEnumerable<string> Tags
);

public record UpdateQuestionRequest(
    QuestionType? Type,
    string? Content,
    string? ImageUrl,
    IEnumerable<QuestionOptionDTO>? Options,
    string? CorrectAnswer,
    int? Score,
    DifficultyLevel? Difficulty,
    IEnumerable<string>? Tags
);

public record QuestionResponse(
    IEnumerable<QuestionDTO> Content,
    int TotalElements,
    int TotalPages
);
