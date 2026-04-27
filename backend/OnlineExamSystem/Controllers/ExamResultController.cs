using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineExamSystem.DTOs;
using OnlineExamSystem.Services;

namespace OnlineExamSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExamResultController : ControllerBase
{
    private readonly IExamResultService _examResultService;

    public ExamResultController(IExamResultService examResultService)
    {
        _examResultService = examResultService;
    }

    [HttpGet("student")]
    [Authorize(Roles = "STUDENT")]
    public async Task<ActionResult<IEnumerable<ExamResultDTO>>> GetStudentResults()
    {
        var studentId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _examResultService.GetResultsByStudentAsync(studentId);
        return Ok(result);
    }

    [HttpGet("{resultId}")]
    [Authorize]
    public async Task<ActionResult<ExamResultDTO>> GetResult(int resultId)
    {
        var result = await _examResultService.GetResultByIdAsync(resultId);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpGet("session/{sessionId}")]
    [Authorize]
    public async Task<ActionResult<ExamResultDTO>> GetResultBySession(int sessionId)
    {
        var result = await _examResultService.GetResultBySessionAsync(sessionId);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpGet("grading/{sessionId}")]
    [Authorize(Roles = "TEACHER")]
    public async Task<ActionResult<IEnumerable<ExamAnswerDTO>>> GetAnswersForGrading(int sessionId)
    {
        var result = await _examResultService.GetAnswersForGradingAsync(sessionId);
        return Ok(result);
    }

    [HttpPut("grading/{answerId}")]
    [Authorize(Roles = "TEACHER")]
    public async Task<ActionResult<ExamAnswerDTO>> GradeAnswer(int answerId, [FromBody] GradeAnswerRequest request)
    {
        var result = await _examResultService.GradeAnswerAsync(answerId, request.Score, request.Comment);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpGet("stats/{examPaperId}")]
    [Authorize(Roles = "TEACHER")]
    public async Task<ActionResult<ExamStatsDTO>> GetExamStats(int examPaperId)
    {
        var result = await _examResultService.GetExamStatsAsync(examPaperId);
        if (result == null)
        {
            return NotFound(new { message = "No exam results found" });
        }
        return Ok(result);
    }
}
