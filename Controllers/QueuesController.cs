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
            public string Name { get; set; }
            public string Description { get; set; }
            public bool Status { get; set; }
        }

        [HttpPost("create")]
        public async Task<ActionResult<Queue>> CreateQueue(QueueModel createQueue)
        {
            Console.WriteLine("fields: ", createQueue.Name, createQueue.Description, createQueue.Status);
            if (createQueue.Name == null)
                return BadRequest("No name specified!");

            var queue = new Queue();
            queue.Name = createQueue.Name;
            queue.Description = createQueue.Description;
            queue.Status = createQueue.Status;
            queue.UserId = Convert.ToInt32(HttpContext.User.FindFirst("UserId").Value);
            queue.QRCode = "Deep Linking";

            _context.Queues.Add(queue);
            await _context.SaveChangesAsync();

            return Ok(queue);
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateQueue(int id, QueueModel updateQueue)
        {
            int userId = Convert.ToInt32(HttpContext.User.FindFirst("UserId").Value);
            var queue = await _context.Queues.FindAsync(id);
            if (queue == null || queue.UserId != userId)
                return BadRequest("Queue is not exist or you not owner.");

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
        public async Task<ActionResult<Queue>> GetQueue(int id)
        {
            var queue = await _context.Queues.FindAsync(id);

            if (queue == null)
                return NotFound();

            return queue;
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
