namespace SUEQ_API.Models
{
    public class Queue
    {
        public int QueueId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public bool Status { get; set; }
        public string QRCode { get; set; }

        public int UserId { get; set; }
        public User User { get; set; }
    }
}
