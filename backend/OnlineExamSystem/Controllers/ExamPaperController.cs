using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineExamSystem.DTOs;
using OnlineExamSystem.Services;

namespace OnlineExamSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "TEACHER")]
public class ExamPaperController : ControllerBase
{
    private readonly IExamPaperService _examPaperService;

    public ExamPaperController(IExamPaperService examPaperService)
    {
        _examPaperService = examPaperService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<ExamPaperDTO>>> GetAllExamPapers()
    {
        var result = await _examPaperService.GetAllExamPapersAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ExamPaperDTO>> GetExamPaper(int id)
    {
        var result = await _examPaperService.GetExamPaperByIdAsync(id);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpPost("auto-generate")]
    public async Task<ActionResult<ExamPaperDTO>> AutoGeneratePaper([FromBody] AutoGeneratePaperRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        try
        {
            var result = await _examPaperService.AutoGeneratePaperAsync(request, userId);
            return CreatedAtAction(nameof(GetExamPaper), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("manual")]
    public async Task<ActionResult<ExamPaperDTO>> CreateManualPaper([FromBody] ManualPaperRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _examPaperService.CreateManualPaperAsync(request, userId);
        return CreatedAtAction(nameof(GetExamPaper), new { id = result.Id }, result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteExamPaper(int id)
    {
        try
        {
            var result = await _examPaperService.DeleteExamPaperAsync(id);
            if (!result)
            {
                return NotFound();
            }
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
