using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SUEQ_API.Models
{
    public class Queue
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string QRCode { get; set; } // TODO: это должно быть UQ и BLOB?

        // Foreign Keys
        public int OwnerId { get; set; }
        public User Owner { get; set; }
    }
}
