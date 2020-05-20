using System.ComponentModel.DataAnnotations;

namespace SUEQ_API.Models
{
    public class Position
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public int Place { get; set; }
        [Required]
        public int QueueId { get; set; } 
        public virtual Queue Queue { get; set; }
        [Required]
        public int UserId { get; set; }
        public User User { get; set; }
    }
}
