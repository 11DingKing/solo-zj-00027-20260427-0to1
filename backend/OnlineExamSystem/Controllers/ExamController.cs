using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineExamSystem.DTOs;
using OnlineExamSystem.Services;

namespace OnlineExamSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "STUDENT")]
public class ExamController : ControllerBase
{
    private readonly IExamService _examService;

    public ExamController(IExamService examService)
    {
        _examService = examService;
    }

    [HttpGet("available")]
    public async Task<ActionResult<IEnumerable<ExamPaperDTO>>> GetAvailableExams()
    {
        var studentId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _examService.GetAvailableExamsAsync(studentId);
        return Ok(result);
    }

    [HttpPost("start/{examPaperId}")]
    public async Task<ActionResult<ExamSessionDTO>> StartExam(int examPaperId)
    {
        var studentId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        try
        {
            var result = await _examService.StartExamAsync(examPaperId, studentId);
            if (result == null)
            {
                return NotFound();
            }
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("session/{sessionId}")]
    public async Task<ActionResult<ExamSessionDTO>> GetExamSession(int sessionId)
    {
        var studentId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _examService.GetExamSessionAsync(sessionId, studentId);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpPost("session/{sessionId}/answer")]
    public async Task<ActionResult<ExamAnswerDTO>> SubmitAnswer(int sessionId, [FromBody] SubmitAnswerRequest request)
    {
        var studentId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        try
        {
            var result = await _examService.SubmitAnswerAsync(sessionId, request, studentId);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("session/{sessionId}/answers")]
    public async Task<ActionResult<IEnumerable<ExamAnswerDTO>>> GetSessionAnswers(int sessionId)
    {
        var studentId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _examService.GetSessionAnswersAsync(sessionId, studentId);
        return Ok(result);
    }

    [HttpPost("session/{sessionId}/submit")]
    public async Task<ActionResult<ExamResultDTO>> SubmitExam(int sessionId)
    {
        var studentId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        try
        {
            var result = await _examService.SubmitExamAsync(sessionId, studentId);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("session/{sessionId}/screen-switch")]
    public async Task<IActionResult> ReportScreenSwitch(int sessionId)
    {
        var studentId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _examService.ReportScreenSwitchAsync(sessionId, studentId);
        return Ok(new { message = "Screen switch reported" });
    }
}
