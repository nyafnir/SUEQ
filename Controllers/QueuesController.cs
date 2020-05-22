using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SUEQ_API.Models;
using System;
using System.Threading.Tasks;

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

        [HttpPost("create")]
        public async Task<ActionResult<ResponseWithQueue>> CreateQueue(QueueModel createQueue)
        {
            if (createQueue.Name == null)
                return BadRequest(new Response
                {
                    Code = 422,
                    DevMessage = "Name not specified.",
                    UserMessage = "Необходимо указать имя очереди!"
                });

            var queue = new Queue
            {
                Name = createQueue.Name,
                Description = createQueue.Description,
                Status = createQueue.Status,
                UserId = Convert.ToInt32(HttpContext.User.FindFirst("UserId").Value),
                QRCode = "Deep Linking" // TODO
            };

            _context.Queues.Add(queue);
            await _context.SaveChangesAsync();

            return Ok(new ResponseWithQueue
            {
                Code = 200,
                DevMessage = "Queue created.",
                UserMessage = "Очередь успешно создана!",
                Queue = new QueueModel(queue)
            });
        }

        [HttpPut("update/{id}")]
        public async Task<ActionResult<ResponseWithQueue>> UpdateQueue(int id, QueueModel updateQueue)
        {
            int userId = Convert.ToInt32(HttpContext.User.FindFirst("UserId").Value);
            var queue = await _context.Queues.FindAsync(id);
            if (queue == null)
                return BadRequest(QueueNotFound());
            if (queue.UserId != userId)
                return BadRequest(QueueNotOwner());

            if (updateQueue.Name != null)
                queue.Name = updateQueue.Name;
            if (updateQueue.Description != null)
                queue.Description = updateQueue.Description;
            queue.Status = updateQueue.Status;

            _context.Entry(queue).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return Ok(new ResponseWithQueue
            {
                Code = 200,
                DevMessage = "Queue updated.",
                UserMessage = "Указанная информация об очереди обновлена!",
                Queue = new QueueModel(queue)
            });
        }

        [HttpGet("info/{id}")]
        public async Task<ActionResult<ResponseWithQueue>> GetQueue(int id)
        {
            var queue = await _context.Queues.FindAsync(id);
            if (queue == null)
                return BadRequest(QueueNotFound());

            int userId = Convert.ToInt32(HttpContext.User.FindFirst("UserId").Value);
            if (queue.UserId != userId)
                return BadRequest(QueueNotOwner());

            return Ok(new ResponseWithQueue
            {
                Code = 200,
                DevMessage = "Got your queue.",
                UserMessage = "Информация об очереди получена!",
                Queue = new QueueModel(queue)
            });
        }

        [HttpDelete("delete/{id}")]
        public async Task<ActionResult<ResponseWithQueue>> DeleteQueue(int id)
        {
            var queue = await _context.Queues.FindAsync(id);
            if (queue == null)
                return BadRequest(QueueNotFound());

            int userId = Convert.ToInt32(HttpContext.User.FindFirst("UserId").Value);
            if (queue.UserId != userId)
                return BadRequest(QueueNotOwner());

            _context.Queues.Remove(queue);
            await _context.SaveChangesAsync();

            return Ok(new ResponseWithQueue
            {
                Code = 200,
                DevMessage = "Queue deleted.",
                UserMessage = "Очередь удалена!"
            });
        }

        public static Response QueueNotFound()
        {
            return new Response
            {
                Code = 422,
                DevMessage = "Queue by ID not found.",
                UserMessage = "Очередь с таким идентификатором не найдена! Может быть она была только что удалена?"
            };
        }

        public static Response QueueNotOwner()
        {
            return new Response
            {
                Code = 422,
                DevMessage = "You not owner the queue.",
                UserMessage = "Вы не владеете этой очередью и не можете выполнять операции над ней!"
            };
        }
    }
}
