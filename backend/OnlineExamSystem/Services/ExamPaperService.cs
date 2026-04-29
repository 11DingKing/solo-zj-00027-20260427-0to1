using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Data;
using OnlineExamSystem.DTOs;
using OnlineExamSystem.Models;

namespace OnlineExamSystem.Services;

public interface IExamPaperService
{
    Task<IEnumerable<ExamPaperDTO>> GetAllExamPapersAsync();
    Task<ExamPaperDTO?> GetExamPaperByIdAsync(int id);
    Task<ExamPaperDTO> AutoGeneratePaperAsync(AutoGeneratePaperRequest request, int creatorId);
    Task<ExamPaperDTO> CreateManualPaperAsync(ManualPaperRequest request, int creatorId);
    Task<bool> DeleteExamPaperAsync(int id);
}

public class ExamPaperService : IExamPaperService
{
    private readonly AppDbContext _context;
    private readonly Random _random = new();

    public ExamPaperService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ExamPaperDTO>> GetAllExamPapersAsync()
    {
        var examPapers = await _context.ExamPapers
            .Include(ep => ep.ExamQuestions)
                .ThenInclude(eq => eq.Question)
                    .ThenInclude(q => q.Options)
            .OrderByDescending(ep => ep.CreatedAt)
            .ToListAsync();

        return examPapers.Select(ToExamPaperDTO);
    }

    public async Task<ExamPaperDTO?> GetExamPaperByIdAsync(int id)
    {
        var examPaper = await _context.ExamPapers
            .Include(ep => ep.ExamQuestions)
                .ThenInclude(eq => eq.Question)
                    .ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(ep => ep.Id == id);

        return examPaper != null ? ToExamPaperDTO(examPaper) : null;
    }

    public async Task<ExamPaperDTO> AutoGeneratePaperAsync(AutoGeneratePaperRequest request, int creatorId)
    {
        var calculatedTotalScore = request.QuestionRequirements.Sum(r => r.Count * r.ScorePerQuestion);
        
        var examPaper = new ExamPaper
        {
            Name = request.Name,
            Description = request.Description,
            TotalScore = calculatedTotalScore,
            PassingScore = request.PassingScore,
            Duration = request.Duration,
            ShuffleQuestions = request.ShuffleQuestions,
            ShuffleOptions = request.ShuffleOptions,
            StartTime = request.StartTime.ToUniversalTime(),
            EndTime = request.EndTime.ToUniversalTime(),
            CreatedBy = creatorId,
            CreatedAt = DateTime.UtcNow
        };

        _context.ExamPapers.Add(examPaper);
        await _context.SaveChangesAsync();

        var examQuestions = new List<ExamQuestion>();
        var questionOrder = 1;

        foreach (var requirement in request.QuestionRequirements)
        {
            var questions = await _context.Questions
                .Include(q => q.Options)
                .Where(q => q.Type == requirement.Type && q.Difficulty == requirement.Difficulty)
                .ToListAsync();

            if (questions.Count < requirement.Count)
            {
                throw new InvalidOperationException(
                    $"Not enough questions available for type {requirement.Type} and difficulty {requirement.Difficulty}. " +
                    $"Available: {questions.Count}, Required: {requirement.Count}");
            }

            var selectedQuestions = Shuffle(questions).Take(requirement.Count).ToList();

            foreach (var question in selectedQuestions)
            {
                examQuestions.Add(new ExamQuestion
                {
                    ExamPaperId = examPaper.Id,
                    QuestionId = question.Id,
                    QuestionOrder = questionOrder++,
                    Score = requirement.ScorePerQuestion
                });
            }
        }

        _context.ExamQuestions.AddRange(examQuestions);
        await _context.SaveChangesAsync();

        examPaper.ExamQuestions = examQuestions;
        return ToExamPaperDTO(examPaper);
    }

    public async Task<ExamPaperDTO> CreateManualPaperAsync(ManualPaperRequest request, int creatorId)
    {
        var questions = await _context.Questions
            .Include(q => q.Options)
            .Where(q => request.QuestionIds.Contains(q.Id))
            .ToDictionaryAsync(q => q.Id);

        var totalScore = questions.Values.Sum(q => q.Score);

        var examPaper = new ExamPaper
        {
            Name = request.Name,
            Description = request.Description,
            TotalScore = totalScore,
            PassingScore = request.PassingScore,
            Duration = request.Duration,
            ShuffleQuestions = request.ShuffleQuestions,
            ShuffleOptions = request.ShuffleOptions,
            StartTime = request.StartTime.ToUniversalTime(),
            EndTime = request.EndTime.ToUniversalTime(),
            CreatedBy = creatorId,
            CreatedAt = DateTime.UtcNow
        };

        _context.ExamPapers.Add(examPaper);
        await _context.SaveChangesAsync();

        var examQuestions = request.QuestionIds
            .Select((questionId, index) => 
            {
                var question = questions.GetValueOrDefault(questionId);
                return new ExamQuestion
                {
                    ExamPaperId = examPaper.Id,
                    QuestionId = questionId,
                    QuestionOrder = index + 1,
                    Score = question?.Score ?? 0
                };
            })
            .ToList();

        _context.ExamQuestions.AddRange(examQuestions);
        await _context.SaveChangesAsync();

        examPaper.ExamQuestions = examQuestions;
        return ToExamPaperDTO(examPaper);
    }

    public async Task<bool> DeleteExamPaperAsync(int id)
    {
        var examPaper = await _context.ExamPapers
            .Include(ep => ep.ExamSessions)
            .FirstOrDefaultAsync(ep => ep.Id == id);

        if (examPaper == null)
        {
            return false;
        }

        if (examPaper.ExamSessions.Any(s => s.Status == ExamSessionStatus.IN_PROGRESS))
        {
            throw new InvalidOperationException("Cannot delete exam paper with active exam sessions");
        }

        _context.ExamPapers.Remove(examPaper);
        await _context.SaveChangesAsync();
        return true;
    }

    private List<T> Shuffle<T>(List<T> list)
    {
        var shuffled = new List<T>(list);
        var n = shuffled.Count;
        while (n > 1)
        {
            n--;
            var k = _random.Next(n + 1);
            (shuffled[k], shuffled[n]) = (shuffled[n], shuffled[k]);
        }
        return shuffled;
    }

    private static ExamPaperDTO ToExamPaperDTO(ExamPaper examPaper)
    {
        return new ExamPaperDTO(
            examPaper.Id,
            examPaper.Name,
            examPaper.Description,
            examPaper.TotalScore,
            examPaper.PassingScore,
            examPaper.Duration,
            examPaper.ShuffleQuestions,
            examPaper.ShuffleOptions,
            examPaper.StartTime,
            examPaper.EndTime,
            examPaper.CreatedBy,
            examPaper.CreatedAt,
            examPaper.UpdatedAt,
            examPaper.ExamQuestions?.Select(eq => new ExamQuestionDTO(
                eq.Id,
                eq.ExamPaperId,
                eq.QuestionId,
                eq.QuestionOrder,
                eq.Score,
                eq.Question != null ? new QuestionDTO(
                    eq.Question.Id,
                    eq.Question.Type,
                    eq.Question.Content,
                    eq.Question.ImageUrl,
                    eq.Question.Options.Select(o => new QuestionOptionDTO(o.Id, o.Text, o.IsCorrect)),
                    eq.Question.CorrectAnswer,
                    eq.Question.Score,
                    eq.Question.Difficulty,
                    eq.Question.Tags,
                    eq.Question.CreatedAt,
                    eq.Question.UpdatedAt
                ) : null!
            )) ?? Enumerable.Empty<ExamQuestionDTO>()
        );
    }
}
