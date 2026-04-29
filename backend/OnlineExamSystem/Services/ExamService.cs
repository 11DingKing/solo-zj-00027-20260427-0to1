using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using OnlineExamSystem.Data;
using OnlineExamSystem.DTOs;
using OnlineExamSystem.Models;

namespace OnlineExamSystem.Services;

public interface IExamService
{
    Task<IEnumerable<ExamPaperDTO>> GetAvailableExamsAsync(int studentId);
    Task<ExamSessionDTO?> StartExamAsync(int examPaperId, int studentId);
    Task<ExamSessionDTO?> GetExamSessionAsync(int sessionId, int studentId);
    Task<ExamAnswerDTO> SubmitAnswerAsync(int sessionId, SubmitAnswerRequest request, int studentId);
    Task<IEnumerable<ExamAnswerDTO>> GetSessionAnswersAsync(int sessionId, int studentId);
    Task<ExamResultDTO> SubmitExamAsync(int sessionId, int studentId);
    Task ReportScreenSwitchAsync(int sessionId, int studentId);
}

public class ExamService : IExamService
{
    private readonly AppDbContext _context;

    public ExamService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ExamPaperDTO>> GetAvailableExamsAsync(int studentId)
    {
        var now = DateTime.UtcNow;
        
        var examPapers = await _context.ExamPapers
            .Include(ep => ep.ExamQuestions)
                .ThenInclude(eq => eq.Question)
                    .ThenInclude(q => q.Options)
            .Where(ep => ep.StartTime <= now && ep.EndTime >= now)
            .OrderBy(ep => ep.StartTime)
            .ToListAsync();

        return examPapers.Select(ToExamPaperDTO);
    }

    public async Task<ExamSessionDTO?> StartExamAsync(int examPaperId, int studentId)
    {
        var examPaper = await _context.ExamPapers
            .Include(ep => ep.ExamQuestions)
                .ThenInclude(eq => eq.Question)
                    .ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(ep => ep.Id == examPaperId);

        if (examPaper == null)
        {
            return null;
        }

        var now = DateTime.UtcNow;
        if (now < examPaper.StartTime)
        {
            throw new InvalidOperationException("Exam has not started yet");
        }
        if (now > examPaper.EndTime)
        {
            throw new InvalidOperationException("Exam has already ended");
        }

        var existingSession = await _context.ExamSessions
            .FirstOrDefaultAsync(s => s.ExamPaperId == examPaperId && s.StudentId == studentId);

        if (existingSession != null)
        {
            if (existingSession.Status == ExamSessionStatus.SUBMITTED)
            {
                throw new InvalidOperationException("You have already submitted this exam");
            }
            if (existingSession.Status == ExamSessionStatus.IN_PROGRESS)
            {
                existingSession.ExamPaper = examPaper;
                return ToExamSessionDTO(existingSession);
            }
        }

        var session = new ExamSession
        {
            ExamPaperId = examPaperId,
            StudentId = studentId,
            StartTime = DateTime.UtcNow,
            Status = ExamSessionStatus.IN_PROGRESS,
            ScreenSwitchCount = 0
        };

        _context.ExamSessions.Add(session);
        await _context.SaveChangesAsync();

        session.ExamPaper = examPaper;
        return ToExamSessionDTO(session);
    }

    public async Task<ExamSessionDTO?> GetExamSessionAsync(int sessionId, int studentId)
    {
        var session = await _context.ExamSessions
            .Include(s => s.ExamPaper)
                .ThenInclude(ep => ep.ExamQuestions)
                    .ThenInclude(eq => eq.Question)
                        .ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.StudentId == studentId);

        return session != null ? ToExamSessionDTO(session) : null;
    }

    public async Task<ExamAnswerDTO> SubmitAnswerAsync(int sessionId, SubmitAnswerRequest request, int studentId)
    {
        var session = await _context.ExamSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.StudentId == studentId);

        if (session == null)
        {
            throw new InvalidOperationException("Exam session not found");
        }

        if (session.Status != ExamSessionStatus.IN_PROGRESS)
        {
            throw new InvalidOperationException("Exam session is not in progress");
        }

        var now = DateTime.UtcNow;
        var examPaper = await _context.ExamPapers
            .FirstOrDefaultAsync(ep => ep.Id == session.ExamPaperId);

        if (examPaper == null)
        {
            throw new InvalidOperationException("Exam paper not found");
        }

        if (now > examPaper.EndTime)
        {
            throw new InvalidOperationException("Exam time has expired");
        }

        var existingAnswer = await _context.ExamAnswers
            .FirstOrDefaultAsync(a => a.ExamSessionId == sessionId && a.QuestionId == request.QuestionId);

        if (existingAnswer != null)
        {
            existingAnswer.StudentAnswer = request.StudentAnswer;
            existingAnswer.AnsweredAt = DateTime.UtcNow;
            _context.ExamAnswers.Update(existingAnswer);
        }
        else
        {
            var answer = new ExamAnswer
            {
                ExamSessionId = sessionId,
                QuestionId = request.QuestionId,
                StudentAnswer = request.StudentAnswer,
                AnsweredAt = DateTime.UtcNow
            };
            _context.ExamAnswers.Add(answer);
        }

        await _context.SaveChangesAsync();

        var savedAnswer = await _context.ExamAnswers
            .Include(a => a.Question)
                .ThenInclude(q => q.Options)
            .FirstAsync(a => a.ExamSessionId == sessionId && a.QuestionId == request.QuestionId);

        return ToExamAnswerDTO(savedAnswer);
    }

    public async Task<IEnumerable<ExamAnswerDTO>> GetSessionAnswersAsync(int sessionId, int studentId)
    {
        var answers = await _context.ExamAnswers
            .Include(a => a.Question)
                .ThenInclude(q => q.Options)
            .Where(a => a.ExamSessionId == sessionId)
            .ToListAsync();

        return answers.Select(ToExamAnswerDTO);
    }

    public async Task<ExamResultDTO> SubmitExamAsync(int sessionId, int studentId)
    {
        var session = await _context.ExamSessions
            .Include(s => s.ExamPaper)
                .ThenInclude(ep => ep.ExamQuestions)
                    .ThenInclude(eq => eq.Question)
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.StudentId == studentId);

        if (session == null)
        {
            throw new InvalidOperationException("Exam session not found");
        }

        if (session.Status == ExamSessionStatus.SUBMITTED)
        {
            var existingResult = await _context.ExamResults
                .Include(r => r.ExamPaper)
                .Include(r => r.Student)
                .FirstOrDefaultAsync(r => r.ExamSessionId == sessionId);

            if (existingResult != null)
            {
                return ToExamResultDTO(existingResult);
            }
        }

        session.Status = ExamSessionStatus.SUBMITTED;
        session.EndTime = DateTime.UtcNow;
        _context.ExamSessions.Update(session);

        var answers = await _context.ExamAnswers
            .Include(a => a.Question)
            .Where(a => a.ExamSessionId == sessionId)
            .ToListAsync();

        var autoScore = 0;
        var questionScores = session.ExamPaper.ExamQuestions
            .ToDictionary(eq => eq.QuestionId, eq => eq.Score);

        foreach (var answer in answers)
        {
            var isAutoGradable = answer.Question.Type != QuestionType.FILL_BLANK;
            if (isAutoGradable)
            {
                var isCorrect = IsAnswerCorrect(answer.StudentAnswer, answer.Question);
                answer.IsCorrect = isCorrect;
                
                if (isCorrect)
                {
                    autoScore += questionScores.GetValueOrDefault(answer.QuestionId, 0);
                }
            }
            
            _context.ExamAnswers.Update(answer);
        }

        var existingExamResult = await _context.ExamResults
            .FirstOrDefaultAsync(r => r.ExamSessionId == sessionId);

        ExamResult result;
        if (existingExamResult != null)
        {
            existingExamResult.AutoScore = autoScore;
            existingExamResult.TotalScore = autoScore + (existingExamResult.TeacherScore ?? 0);
            existingExamResult.IsPassed = existingExamResult.TotalScore >= session.ExamPaper.PassingScore;
            existingExamResult.SubmittedAt = DateTime.UtcNow;
            result = existingExamResult;
        }
        else
        {
            result = new ExamResult
            {
                ExamSessionId = sessionId,
                StudentId = studentId,
                ExamPaperId = session.ExamPaperId,
                TotalScore = autoScore,
                AutoScore = autoScore,
                TeacherScore = null,
                IsPassed = autoScore >= session.ExamPaper.PassingScore,
                SubmittedAt = DateTime.UtcNow
            };
            _context.ExamResults.Add(result);
        }

        await _context.SaveChangesAsync();

        result.ExamPaper = session.ExamPaper;
        result.Student = session.Student;
        return ToExamResultDTO(result);
    }

    public async Task ReportScreenSwitchAsync(int sessionId, int studentId)
    {
        var session = await _context.ExamSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.StudentId == studentId);

        if (session != null)
        {
            session.ScreenSwitchCount++;
            _context.ExamSessions.Update(session);
            await _context.SaveChangesAsync();
        }
    }

    private static bool IsAnswerCorrect(string studentAnswer, Question question)
    {
        try
        {
            switch (question.Type)
            {
                case QuestionType.SINGLE_CHOICE:
                case QuestionType.TRUE_FALSE:
                    return studentAnswer == question.CorrectAnswer;

                case QuestionType.MULTIPLE_CHOICE:
                    var studentSelected = JsonConvert.DeserializeObject<List<string>>(studentAnswer);
                    var correctAnswers = JsonConvert.DeserializeObject<List<string>>(question.CorrectAnswer);
                    
                    if (studentSelected == null || correctAnswers == null)
                        return false;
                    
                    return studentSelected.Count == correctAnswers.Count &&
                           studentSelected.All(s => correctAnswers.Contains(s));

                default:
                    return false;
            }
        }
        catch
        {
            return false;
        }
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

    private static ExamSessionDTO ToExamSessionDTO(ExamSession session)
    {
        return new ExamSessionDTO(
            session.Id,
            session.ExamPaperId,
            session.StudentId,
            session.StartTime,
            session.EndTime,
            session.Status,
            session.ScreenSwitchCount,
            session.ExamPaper != null ? ToExamPaperDTO(session.ExamPaper) : null!
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
}
