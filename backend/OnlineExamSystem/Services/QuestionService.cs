using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Data;
using OnlineExamSystem.DTOs;
using OnlineExamSystem.Models;

namespace OnlineExamSystem.Services;

public interface IQuestionService
{
    Task<QuestionResponse> GetQuestionsAsync(int page, int size, QuestionType? type, DifficultyLevel? difficulty, string? tags);
    Task<QuestionDTO?> GetQuestionByIdAsync(int id);
    Task<QuestionDTO> CreateQuestionAsync(CreateQuestionRequest request, int creatorId);
    Task<QuestionDTO?> UpdateQuestionAsync(int id, UpdateQuestionRequest request);
    Task<bool> DeleteQuestionAsync(int id);
    Task<IEnumerable<string>> GetAllTagsAsync();
}

public class QuestionService : IQuestionService
{
    private readonly AppDbContext _context;

    public QuestionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<QuestionResponse> GetQuestionsAsync(
        int page,
        int size,
        QuestionType? type,
        DifficultyLevel? difficulty,
        string? tags)
    {
        var query = _context.Questions
            .Include(q => q.Options)
            .OrderByDescending(q => q.CreatedAt)
            .AsQueryable();

        if (type.HasValue)
        {
            query = query.Where(q => q.Type == type.Value);
        }

        if (difficulty.HasValue)
        {
            query = query.Where(q => q.Difficulty == difficulty.Value);
        }

        if (!string.IsNullOrEmpty(tags))
        {
            var tagList = tags.Split(',').Select(t => t.Trim()).ToList();
            query = query.Where(q => q.Tags.Any(t => tagList.Contains(t)));
        }

        var totalElements = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalElements / (double)size);

        var questions = await query
            .Skip((page - 1) * size)
            .Take(size)
            .ToListAsync();

        var questionDtos = questions.Select(ToQuestionDTO).ToList();

        return new QuestionResponse(questionDtos, totalElements, totalPages);
    }

    public async Task<QuestionDTO?> GetQuestionByIdAsync(int id)
    {
        var question = await _context.Questions
            .Include(q => q.Options)
            .FirstOrDefaultAsync(q => q.Id == id);

        return question != null ? ToQuestionDTO(question) : null;
    }

    public async Task<QuestionDTO> CreateQuestionAsync(CreateQuestionRequest request, int creatorId)
    {
        var question = new Question
        {
            Type = request.Type,
            Content = request.Content,
            ImageUrl = request.ImageUrl,
            CorrectAnswer = request.CorrectAnswer,
            Score = request.Score,
            Difficulty = request.Difficulty,
            Tags = request.Tags.ToArray(),
            CreatedAt = DateTime.UtcNow
        };

        _context.Questions.Add(question);
        await _context.SaveChangesAsync();

        if (request.Options != null && request.Options.Any())
        {
            var options = request.Options
                .Select((opt, index) => new QuestionOption
                {
                    QuestionId = question.Id,
                    Text = opt.Text,
                    IsCorrect = opt.IsCorrect,
                    OptionOrder = index + 1
                })
                .ToList();

            _context.QuestionOptions.AddRange(options);
            await _context.SaveChangesAsync();

            question.Options = options;
        }

        return ToQuestionDTO(question);
    }

    public async Task<QuestionDTO?> UpdateQuestionAsync(int id, UpdateQuestionRequest request)
    {
        var question = await _context.Questions
            .Include(q => q.Options)
            .FirstOrDefaultAsync(q => q.Id == id);

        if (question == null)
        {
            return null;
        }

        if (request.Type.HasValue) question.Type = request.Type.Value;
        if (request.Content != null) question.Content = request.Content;
        if (request.ImageUrl != null) question.ImageUrl = request.ImageUrl;
        if (request.CorrectAnswer != null) question.CorrectAnswer = request.CorrectAnswer;
        if (request.Score.HasValue) question.Score = request.Score.Value;
        if (request.Difficulty.HasValue) question.Difficulty = request.Difficulty.Value;
        if (request.Tags != null) question.Tags = request.Tags.ToArray();
        question.UpdatedAt = DateTime.UtcNow;

        if (request.Options != null)
        {
            _context.QuestionOptions.RemoveRange(question.Options);
            question.Options.Clear();

            var newOptions = request.Options
                .Select((opt, index) => new QuestionOption
                {
                    QuestionId = question.Id,
                    Text = opt.Text,
                    IsCorrect = opt.IsCorrect,
                    OptionOrder = index + 1
                })
                .ToList();

            _context.QuestionOptions.AddRange(newOptions);
            question.Options = newOptions;
        }

        await _context.SaveChangesAsync();
        return ToQuestionDTO(question);
    }

    public async Task<bool> DeleteQuestionAsync(int id)
    {
        var question = await _context.Questions.FindAsync(id);
        if (question == null)
        {
            return false;
        }

        _context.Questions.Remove(question);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<string>> GetAllTagsAsync()
    {
        var tags = await _context.Questions
            .SelectMany(q => q.Tags)
            .Distinct()
            .OrderBy(t => t)
            .ToListAsync();

        return tags;
    }

    private static QuestionDTO ToQuestionDTO(Question question)
    {
        return new QuestionDTO(
            question.Id,
            question.Type,
            question.Content,
            question.ImageUrl,
            question.Options.Select(o => new QuestionOptionDTO(o.Id, o.Text, o.IsCorrect)),
            question.CorrectAnswer,
            question.Score,
            question.Difficulty,
            question.Tags,
            question.CreatedAt,
            question.UpdatedAt
        );
    }
}
