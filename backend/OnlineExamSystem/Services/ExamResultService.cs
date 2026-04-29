using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Data;
using OnlineExamSystem.DTOs;
using OnlineExamSystem.Models;

namespace OnlineExamSystem.Services;

public interface IExamResultService
{
    Task<IEnumerable<ExamResultDTO>> GetResultsByStudentAsync(int studentId);
    Task<ExamResultDTO?> GetResultByIdAsync(int resultId);
    Task<ExamResultDTO?> GetResultBySessionAsync(int sessionId);
    Task<IEnumerable<ExamAnswerDTO>> GetAnswersForGradingAsync(int sessionId);
    Task<ExamAnswerDTO?> GradeAnswerAsync(int answerId, int score, string? comment);
    Task<ExamStatsDTO?> GetExamStatsAsync(int examPaperId);
}

public class ExamResultService : IExamResultService
{
    private readonly AppDbContext _context;

    public ExamResultService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ExamResultDTO>> GetResultsByStudentAsync(int studentId)
    {
        var results = await _context.ExamResults
            .Include(r => r.ExamPaper)
            .Include(r => r.Student)
            .Where(r => r.StudentId == studentId)
            .OrderByDescending(r => r.SubmittedAt)
            .ToListAsync();

        return results.Select(ToExamResultDTO);
    }

    public async Task<ExamResultDTO?> GetResultByIdAsync(int resultId)
    {
        var result = await _context.ExamResults
            .Include(r => r.ExamPaper)
                .ThenInclude(ep => ep.ExamQuestions)
                    .ThenInclude(eq => eq.Question)
            .Include(r => r.Student)
            .FirstOrDefaultAsync(r => r.Id == resultId);

        return result != null ? ToExamResultDTO(result) : null;
    }

    public async Task<ExamResultDTO?> GetResultBySessionAsync(int sessionId)
    {
        var result = await _context.ExamResults
            .Include(r => r.ExamPaper)
                .ThenInclude(ep => ep.ExamQuestions)
                    .ThenInclude(eq => eq.Question)
            .Include(r => r.Student)
            .FirstOrDefaultAsync(r => r.ExamSessionId == sessionId);

        return result != null ? ToExamResultDTO(result) : null;
    }

    public async Task<IEnumerable<ExamAnswerDTO>> GetAnswersForGradingAsync(int sessionId)
    {
        var answers = await _context.ExamAnswers
            .Include(a => a.Question)
                .ThenInclude(q => q.Options)
            .Where(a => a.ExamSessionId == sessionId)
            .OrderBy(a => a.Id)
            .ToListAsync();

        return answers.Select(ToExamAnswerDTO);
    }

    public async Task<ExamAnswerDTO?> GradeAnswerAsync(int answerId, int score, string? comment)
    {
        var answer = await _context.ExamAnswers
            .Include(a => a.Question)
                .ThenInclude(q => q.Options)
            .Include(a => a.ExamSession)
            .FirstOrDefaultAsync(a => a.Id == answerId);

        if (answer == null)
        {
            return null;
        }

        answer.TeacherScore = score;
        answer.TeacherComment = comment;
        _context.ExamAnswers.Update(answer);

        var result = await _context.ExamResults
            .FirstOrDefaultAsync(r => r.ExamSessionId == answer.ExamSessionId);

        if (result != null)
        {
            var fillBlankAnswers = await _context.ExamAnswers
                .Where(a => a.ExamSessionId == answer.ExamSessionId && a.Question.Type == QuestionType.FILL_BLANK)
                .ToListAsync();

            var totalTeacherScore = fillBlankAnswers.Sum(a => a.TeacherScore ?? 0);
            result.TeacherScore = totalTeacherScore;
            result.TotalScore = result.AutoScore + totalTeacherScore;

            var examPaper = await _context.ExamPapers
                .FirstOrDefaultAsync(ep => ep.Id == result.ExamPaperId);

            if (examPaper != null)
            {
                result.IsPassed = result.TotalScore >= examPaper.PassingScore;
            }

            result.GradedAt = DateTime.UtcNow;
            _context.ExamResults.Update(result);
        }

        await _context.SaveChangesAsync();
        return ToExamAnswerDTO(answer);
    }

    public async Task<ExamStatsDTO?> GetExamStatsAsync(int examPaperId)
    {
        var results = await _context.ExamResults
            .Include(r => r.ExamPaper)
            .Include(r => r.Student)
            .Where(r => r.ExamPaperId == examPaperId)
            .ToListAsync();

        if (results.Count == 0)
        {
            return null;
        }

        var allAnswers = await _context.ExamAnswers
            .Include(a => a.Question)
            .Include(a => a.ExamSession)
            .Where(a => a.ExamSession.ExamPaperId == examPaperId)
            .ToListAsync();

        var avgScore = results.Average(r => r.TotalScore);
        var maxScore = results.Max(r => r.TotalScore);
        var minScore = results.Min(r => r.TotalScore);

        var scoreDistribution = new List<ScoreDistributionDTO>
        {
            new("0-60", results.Count(r => r.TotalScore < 60)),
            new("60-70", results.Count(r => r.TotalScore >= 60 && r.TotalScore < 70)),
            new("70-80", results.Count(r => r.TotalScore >= 70 && r.TotalScore < 80)),
            new("80-90", results.Count(r => r.TotalScore >= 80 && r.TotalScore < 90)),
            new("90-100", results.Count(r => r.TotalScore >= 90))
        };

        var questionStats = allAnswers
            .GroupBy(a => a.QuestionId)
            .Select(g =>
            {
                var totalAttempts = g.Count();
                var correctCount = g.Count(a => a.IsCorrect == true);
                var correctRate = totalAttempts > 0 ? (double)correctCount / totalAttempts : 0;

                var highGroup = results.Where(r => r.TotalScore >= avgScore).Select(r => r.StudentId).ToList();
                var lowGroup = results.Where(r => r.TotalScore < avgScore).Select(r => r.StudentId).ToList();

                var highCorrectRate = g.Count(a => highGroup.Contains(a.ExamSession.StudentId) && a.IsCorrect == true) / (double)Math.Max(highGroup.Count, 1);
                var lowCorrectRate = g.Count(a => lowGroup.Contains(a.ExamSession.StudentId) && a.IsCorrect == true) / (double)Math.Max(lowGroup.Count, 1);

                var discrimination = highCorrectRate - lowCorrectRate;

                var question = g.FirstOrDefault()?.Question;
                return new QuestionStatDTO(
                    g.Key,
                    question?.Content ?? "Unknown",
                    totalAttempts,
                    correctCount,
                    correctRate,
                    discrimination
                );
            })
            .ToList();

        var tagStats = allAnswers
            .SelectMany(a => a.Question.Tags.Select(t => new { Tag = t, Answer = a }))
            .GroupBy(x => x.Tag)
            .Select(g =>
            {
                var totalQuestions = g.Select(x => x.Answer.QuestionId).Distinct().Count();
                var correctCount = g.Count(x => x.Answer.IsCorrect == true);
                var totalAttempts = g.Count();
                var correctRate = totalAttempts > 0 ? (double)correctCount / totalAttempts * 100 : 0;

                return new TagStatDTO(g.Key, totalQuestions, correctRate);
            })
            .ToList();

        return new ExamStatsDTO(
            avgScore,
            maxScore,
            minScore,
            results.Count,
            scoreDistribution,
            questionStats,
            tagStats
        );
    }

    private static ExamResultDTO ToExamResultDTO(ExamResult result)
    {
        return new ExamResultDTO(
            result.Id,
            result.ExamSessionId,
            result.StudentId,
            result.ExamPaperId,
            result.TotalScore,
            result.AutoScore,
            result.TeacherScore,
            result.IsPassed,
            result.SubmittedAt,
            result.GradedAt,
            result.ExamPaper != null ? ToExamPaperDTO(result.ExamPaper) : null,
            result.Student != null ? new UserDTO(result.Student.Id, result.Student.UserName!, result.Student.Name, result.Student.Role) : null
        );
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

    private static ExamAnswerDTO ToExamAnswerDTO(ExamAnswer answer)
    {
        return new ExamAnswerDTO(
            answer.Id,
            answer.ExamSessionId,
            answer.QuestionId,
            answer.StudentAnswer,
            answer.IsCorrect,
            answer.TeacherScore,
            answer.TeacherComment,
            answer.AnsweredAt,
            answer.Question != null ? new QuestionDTO(
                answer.Question.Id,
                answer.Question.Type,
                answer.Question.Content,
                answer.Question.ImageUrl,
                answer.Question.Options.Select(o => new QuestionOptionDTO(o.Id, o.Text, o.IsCorrect)),
                answer.Question.CorrectAnswer,
                answer.Question.Score,
                answer.Question.Difficulty,
                answer.Question.Tags,
                answer.Question.CreatedAt,
                answer.Question.UpdatedAt
            ) : null
        );
    }
}
