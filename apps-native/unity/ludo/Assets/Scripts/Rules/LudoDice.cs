using System;
using System.Collections.Generic;

namespace W3Dev.Ludo
{
    public interface ILudoDiceSource
    {
        int Roll();
    }

    public interface ILudoDeterministicDiceSource : ILudoDiceSource
    {
    }

    public sealed class RandomLudoDiceSource : ILudoDiceSource
    {
        private readonly Random random;

        public RandomLudoDiceSource()
            : this(Environment.TickCount ^ Guid.NewGuid().GetHashCode())
        {
        }

        public RandomLudoDiceSource(int seed)
        {
            random = new Random(seed);
        }

        public int Roll()
        {
            return random.Next(1, 7);
        }
    }

    public sealed class SequenceLudoDiceSource : ILudoDeterministicDiceSource
    {
        private readonly int[] values;
        private readonly bool repeat;
        private int index;

        public SequenceLudoDiceSource(IEnumerable<int> rolls, bool repeatSequence = false)
        {
            if (rolls == null)
                throw new ArgumentNullException(nameof(rolls));

            values = new List<int>(rolls).ToArray();
            if (values.Length == 0)
                throw new ArgumentException("At least one die result is required.", nameof(rolls));
            for (var valueIndex = 0; valueIndex < values.Length; valueIndex++)
            {
                if (values[valueIndex] < 1 || values[valueIndex] > 6)
                    throw new ArgumentOutOfRangeException(nameof(rolls));
            }
            repeat = repeatSequence;
        }

        public int Roll()
        {
            if (index >= values.Length)
            {
                if (!repeat)
                    throw new InvalidOperationException("The deterministic die sequence is exhausted.");
                index = 0;
            }
            return values[index++];
        }
    }
}
