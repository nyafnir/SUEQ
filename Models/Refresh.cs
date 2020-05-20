using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SUEQ_API.Models
{
    public class Refresh
    {
        [Key]
        public int UserId { get; set; }
        public List<User> Users { get; set; }
        [Required]
        public string AccessToken { get; set; }
        [Required]
        public string RefreshToken { get; set; }
        [Required]
        public DateTime AtCreated { get; set; }
    }
}
