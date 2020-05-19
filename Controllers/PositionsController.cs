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
        public async Task<ActionResult<ResponseWithPosition>> InQueue(int queueId)
        {
            var queue = await _context.Queues.FindAsync(queueId);
            if (queue == null)
                return BadRequest(QueuesController.QueueNotFound());
            if (!queue.Status)
                return BadRequest(new Response
                {
                    Code = 422,
                    DevMessage = "Queue closed.",
                    UserMessage = "Очередь закрыта, а это значит, что владелец не принимает " +
                    "посетителей, посмотрите часы работы!"
                });

            int userId = Convert.ToInt32(HttpContext.User.FindFirst("UserId").Value);
            bool userInQueue = await _context.Positions.AnyAsync(p => 
                p.QueueId == queue.QueueId && p.UserId == userId);
            if (userInQueue)
                return BadRequest(new Response
                {
                    Code = 422,
                    DevMessage = "Already in queue.",
                    UserMessage = "Вы уже стоите в этой очереди!"
                });

            int lastPlace = await _context.Positions.CountAsync(p => p.QueueId == queueId);
            var position = new Position
            {
                QueueId = queueId,
                UserId = userId,
                Place = lastPlace + 1
            };
            
            _context.Positions.Add(position);
            await _context.SaveChangesAsync();

            return Ok(new ResponseWithPosition
            {
                Code = 200,
                DevMessage = "In queue.",
                UserMessage = $"Вы встали в очередь, Ваш номер: {position.Place}!",
                Position = new PositionModel(position)
            });
        }
        // Если очередь изменилась, нужно проверить, что нет пустых мест или повторящихся Place
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
        public async Task<ActionResult<Response>> OutQueue(int queueId)
        {
            var userId = Convert.ToInt32(HttpContext.User.FindFirst("UserId").Value);

            var position = await _context.Positions.SingleOrDefaultAsync(p => 
                p.QueueId == queueId && p.UserId == userId);
            if (position == null)
                return BadRequest(new Response
                {
                    Code = 422,
                    DevMessage = "Not in queue.",
                    UserMessage = "Вас нет в этой очереди! Может быть Вас только что убрали из неё?"
                });

            int deletedPlace = position.Place;

            _context.Positions.Remove(position);
            await _context.SaveChangesAsync();

            await ReCalcPositions(queueId, deletedPlace);

            return Ok(new Response
            {
                Code = 200,
                DevMessage = "Out queue.",
                UserMessage = "Вы покинули очередь!"
            });
        }
        // Удалить стоящего в очереди (владелец)
        [HttpDelete("{queueId}/{userId}")]
        public async Task<ActionResult<Response>> DeleteFromQueue(int queueId, int userId)
        {
            var ownerId = Convert.ToInt32(HttpContext.User.FindFirst("UserId").Value);
            var queue = await _context.Queues.SingleOrDefaultAsync(q => 
                q.UserId == userId && q.QueueId == queueId);
            if (queue == null)
                return BadRequest(QueuesController.QueueNotFound());
            if (queue.UserId != ownerId)
                return BadRequest(QueuesController.QueueNotOwner());

            var position = await _context.Positions.SingleOrDefaultAsync(p => 
                p.QueueId == queueId && p.UserId == userId);
            if (position == null)
                return BadRequest(new Response
                {
                    Code = 422,
                    DevMessage = "User not exist in the queue.",
                    UserMessage = "Этого пользователя нет в этой очереди!"
                });

            int deletedPlace = position.Place;

            _context.Positions.Remove(position);
            await _context.SaveChangesAsync();

            await ReCalcPositions(queueId, deletedPlace);

            return Ok(new ResponseWithPosition
            {
                Code = 200,
                DevMessage = "Client removed from queue.",
                UserMessage = "Пользователь удален из очереди!"
            });
        }

        // Изменить позицию стоящего в очереди(владелец)
        [HttpPut("{queueId}")]
        public async Task<ActionResult<Response>> ChangePosition(int queueId, PositionModel changePosition)
        {
            int ownerId = Convert.ToInt32(HttpContext.User.FindFirst("UserId").Value);
            var queue = await _context.Queues.SingleOrDefaultAsync(q => 
                q.UserId == ownerId && q.QueueId == queueId);
            if (queue == null)
                return BadRequest(QueuesController.QueueNotFound());
            if (queue.UserId != ownerId)
                return BadRequest(QueuesController.QueueNotOwner());

            var position = await _context.Positions.SingleOrDefaultAsync(p =>
                p.UserId == changePosition.UserId && p.QueueId == queueId);

            int lastPlace = await _context.Positions.CountAsync(p => p.QueueId == queueId);
            if (changePosition.Place < 1 || changePosition.Place > lastPlace || changePosition.Place == position.Place)
                return BadRequest(new Response
                {
                    Code = 422,
                    DevMessage = "Incorrect place (small them one or bigger last place or unchanged)",
                    UserMessage = "Место должно быть целочисленным и не больше последнего стоящего в очереди!"
                });

            position.Place = changePosition.Place;

            _context.Entry(position).State = EntityState.Modified;
           await _context.SaveChangesAsync();

            return Ok(new Response
            {
                Code = 200,
                DevMessage = "Place change.",
                UserMessage = $"Указанный человек перемещен на {position.Place} место!"
            });
        }
        // Получение информации о пользователях в очереди
        [HttpGet("{queueId}")]
        public ActionResult<IEnumerable<ResponseWithPositions>> GetAllUsersInQueue(int queueId)
        {
            var allPositions = _context.Positions.Where(p => p.QueueId == queueId).ToList();
            if (allPositions == null)
                return Ok("Queue empty.");

            return Ok(new ResponseWithPositions
            {
                Code = 200,
                DevMessage = "Got your queue clients.",
                UserMessage = "Информация о стоящих в очереди получена!",
                Positions = allPositions
            });
        }
    }
}
