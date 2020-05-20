using System.ComponentModel.DataAnnotations;

namespace SUEQ_API.Models
{
	// Базовый ответ от сервера
    public class Response
    {
		[Required]
		public int Code { get; set; }
		[Required]
		public string DevMessage { get; set; }
		public string UserMessage { get; set; }
	}

	// Отправляемая модель авторизации
	public class LoginModel
	{
		[Required]
		public string Email { get; set; }
		[Required]
		public string Password { get; set; }
	}


	// Возвращаемая модель пользователя
	public class UserModel : LoginModel
	{
		public UserModel()
		{
		}

		public UserModel(User user)
		{
			UserId = user.UserId;
			Email = user.Email;
			Password = null;
			FirstName = user.FirstName;
			SurName = user.SurName;
			LastName = user.LastName;
		}

		public int UserId { get; set; }
		public string FirstName { get; set; }
		public string SurName { get; set; }
		public string LastName { get; set; }
	}

	// Стандартный ответ содержащий пользователя
	public class ResponseWithUser : Response
	{
		[Required]
		public object User { get; set; }
	}

	// Стандартный ответ содержащий токен и пользователя
	public class ResponseWithToken : ResponseWithUser
	{
		[Required]
		public string AccessToken { get; set; }
		[Required]
		public string RefreshToken { get; set; }
	}


	// Возвращаемая модель очереди
	public class QueueModel
	{
		public QueueModel()
		{
		}

		public QueueModel(Queue queue)
		{
			QueueId = queue.QueueId;
			OwnerId = queue.UserId;
			Name = queue.Name;
			Description = queue.Description;
			Status = queue.Status;
			QRCode = queue.QRCode;
		}

		public int QueueId { get; set; }
		public int OwnerId { get; set; }
		public string Name { get; set; }
		public string Description { get; set; }
		public bool Status { get; set; }
		public string QRCode { get; set; }
	}

	// Стандартный ответ содержащий очередь
	public class ResponseWithQueue : Response
	{
		[Required]
		public object Queue { get; set; }
	}


	// Возвращаемая модель позиции
	public class PositionModel
	{
		public PositionModel()
		{
		}

		public PositionModel(Position position)
		{
			Place = position.Place;
			QueueId = position.QueueId;
			UserId = position.UserId;
		}

		public int Place { get; set; }
		public int QueueId { get; set; }
		public int UserId { get; set; }
	}

	// Стандартный ответ содержащий позицию
	public class ResponseWithPosition : Response
	{
		[Required]
		public object Position { get; set; }
	}
	// Стандартный ответ содержащий список позиций в очереди
	public class ResponseWithPositions : Response
	{
		[Required]
		public object Positions { get; set; }
	}
}
