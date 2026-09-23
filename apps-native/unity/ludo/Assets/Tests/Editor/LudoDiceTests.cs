using NUnit.Framework;

namespace W3Dev.Ludo.Tests
{
    public sealed class LudoDiceTests
    {
        [Test]
        public void ExhaustedDeterministicSequenceThrowsInsteadOfCycling()
        {
            var dice = new SequenceLudoDiceSource(new[] { 4 });

            Assert.That(dice.Roll(), Is.EqualTo(4));
            Assert.That(() => dice.Roll(), Throws.InvalidOperationException);
        }
    }
}
