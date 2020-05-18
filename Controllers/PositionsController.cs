using System;
using System.Collections.Generic;
using System.Linq;
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
    public class PositionsController : ControllerBase
    {
        private readonly SUEQContext _context;
        public PositionsController(SUEQContext context)
        {
            _context = context;
        }
        // Встать в очередь
        [HttpPost("{queueId}")]
        public async Task<ActionResult<Position>> InQueue(int queueId)
        {
            var queue = await _context.Queues.FindAsync(queueId);
            if (queue == null)
                return BadRequest("Queue not exist.");
            if (!queue.Status)
                return BadRequest("Queue closed.");

            int userId = Convert.ToInt32(HttpContext.User.FindFirst("UserId").Value);
            bool userInQueue = await _context.Positions.AnyAsync(p => p.QueueId == queue.QueueId && p.UserId == userId);
            if (userInQueue)
                return BadRequest("Already in queue");

            var position = new Position();
            position.QueueId = queueId;
            position.UserId = userId;
            int count = await _context.Positions.CountAsync(item => item.QueueId == queueId);
            position.Place = count + 1;

            _context.Positions.Add(position);
            await _context.SaveChangesAsync();

            return Ok(position);
        }
        // Если очередь изменилась, нужно проверить что нет пустых мест или повторящихся
        private async Task<bool> ReCalcPositions(int queueId, int deletedPlace)
        {
            int lastPlace = await _context.Positions.CountAsync(p => p.QueueId == queueId);

            for (int i = deletedPlace + 1; i <= lastPlace; i += 1)
            {
                var position = await _context.Positions.SingleAsync(p => p.Place == i && p.QueueId == queueId);
                position.Place -= 1;
                _context.Entry(position).State = EntityState.Modified;
                await _context.SaveChangesAsync();
            }

            return true;
        }
        // Выйти из очереди
        [HttpDelete("{queueId}")]
        public async Task<ActionResult> OutQueue(int queueId)
        {
            var userId = Convert.ToInt32(HttpContext.User.FindFirst("UserId").Value);
            var position = await _context.Positions.SingleOrDefaultAsync(p => p.QueueId == queueId && p.UserId == userId);
            if (position == null)
                return NotFound();

            int deletedPlace = position.Place;

            _context.Positions.Remove(position);
            await _context.SaveChangesAsync();

            await ReCalcPositions(queueId, deletedPlace);

            return Ok("Out queue.");
        }
        // Удалить стоящего в очереди (владелец)
        [HttpDelete("{queueId}/{userId}")]
        public async Task<ActionResult> OutQueue(int queueId, int userId)
        {
            var ownerId = Convert.ToInt32(HttpContext.User.FindFirst("UserId").Value);
            var isOwner = await _context.Queues.AnyAsync(q => q.UserId == userId && q.QueueId == queueId);
            if (!isOwner)
                return BadRequest("You not owner or queue not exist.");

            var position = await _context.Positions.SingleOrDefaultAsync(p => p.QueueId == queueId && p.UserId == userId);
            if (position == null)
                return NotFound();

            int deletedPlace = position.Place;

            _context.Positions.Remove(position);
            await _context.SaveChangesAsync();

            await ReCalcPositions(queueId, deletedPlace);

            return Ok("Client removed from queue.");
        }
        public class PositionModel
        {
            public int UserId { get; set; }
            public int Place { get; set; }
        }
        // Изменить позицию стоящего в очереди(владелец)
        [HttpPut("{queueId}")]
        public async Task<ActionResult<Position[]>> ChangePosition(int queueId, PositionModel changePosition)
        {
            int userId = Convert.ToInt32(HttpContext.User.FindFirst("UserId").Value);
            var isOwner = await _context.Queues.AnyAsync(q => q.UserId == userId && q.QueueId == queueId);
            if (!isOwner)
                return BadRequest("You not owner or queue not exist.");

            var position = await _context.Positions.SingleOrDefaultAsync(p =>
                p.UserId == changePosition.UserId && p.QueueId == queueId);

            int lastPlace = await _context.Positions.CountAsync(p => p.QueueId == queueId);
            if (changePosition.Place < 1 || changePosition.Place > lastPlace || changePosition.Place == position.Place)
                return BadRequest("Incorrect place (small them one or bigger last place or unchanged)");

            position.Place = changePosition.Place;

            _context.Entry(position).State = EntityState.Modified;
           await _context.SaveChangesAsync();

            return NoContent();
        }
        // Получение информации о пользователях в очереди
        [HttpGet("{queueId}")]
        public ActionResult<IEnumerable<Position>> GetAllPosition(int queueId)
        {
            var allPositions = _context.Positions.Where(p => p.QueueId == queueId).ToList();
            if (allPositions == null)
                return Ok("Queue empty.");

            return allPositions;
        }
    }
}
