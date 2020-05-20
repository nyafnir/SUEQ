using System.ComponentModel.DataAnnotations;

namespace SUEQ_API.Models
{
    public class Queue
    {
        [Key]
        public int QueueId { get; set; }
        [Required]
        public string Name { get; set; }
        public string Description { get; set; }
        [Required]
        public bool Status { get; set; }
        public string QRCode { get; set; }
        [Required]
        public int UserId { get; set; }
        public User User { get; set; }
    }
}
