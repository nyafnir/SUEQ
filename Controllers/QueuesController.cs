using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SUEQ_API.Models;

namespace SUEQ_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class QueuesController : ControllerBase
    {
        private readonly SUEQContext _context;

        public QueuesController(SUEQContext context)
        {
            _context = context;
        }

        public class QueueModel
        {
            public string Name = null;
            public string Description = null;
            public bool Status = true;
        }

        [HttpPost("create")]
        public async Task<ActionResult> CreateQueue(QueueModel createQueue)
        {
            if (createQueue.Name == null)
            {
                return BadRequest("No name specified!");
            }

            var queue = new Queue();
                queue.Name = createQueue.Name;
                queue.Description = createQueue.Description;
                queue.Status = createQueue.Status;

            _context.Queues.Add(queue);
            await _context.SaveChangesAsync();

            return Ok(new { QRCode = "Deep Linking" }) ;
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateQueue(int id, QueueModel updateQueue)
        {
            int userId = Convert.ToInt32(HttpContext.User.FindFirst("UserId").Value);
            var user = await _context.Users.FindAsync(userId);

            var queue = user.Queues.Find(queue => queue.QueueId == id);
            if (queue == null)
                return BadRequest();

            if (queue.Name != null)
                queue.Name = updateQueue.Name;
            if (queue.Description != null)
                queue.Description = updateQueue.Description;
            
            queue.Status = updateQueue.Status;

            _context.Entry(queue).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return Ok("Queue updated.");
        }

        [HttpGet("info/{id}")]
        public async Task<ActionResult<QueueModel>> GetQueue(int id)
        {
            var queue = await _context.Queues.FindAsync(id);

            if (queue == null)
                return NotFound();

            var info = new QueueModel();
                info.Name = queue.Name;
                info.Description = queue.Description;
                info.Status = queue.Status;

            return info;
        }

        [HttpDelete("delete/{id}")]
        public async Task<ActionResult<Queue>> DeleteQueue(int id)
        {
            var queue = await _context.Queues.FindAsync(id);
            if (queue == null)
                return NotFound();

            _context.Queues.Remove(queue);
            await _context.SaveChangesAsync();

            return Ok("Queue deleted.");
        }
    }
}
