import {
  type Customer,
  type Face,
  getRegular,
  OUTCOME_WORDS,
  type Outcome,
  type SeatState,
  type ShiftState,
} from "@web-games/the-last-window-core";
import { useEffect, useRef } from "preact/hooks";
import { ItemIcon } from "../../art/ItemIcon";
import { Portrait } from "../../art/Portrait";
import { regularPrefix, walkinId } from "../../art/slots";
import { customerName, orderText, secondsLeft } from "../../labels";
import { useMotion } from "../../motion/useMotion";
import { t } from "../../strings";
import { Glyph } from "../../ui/Glyph";
import { MoodChip } from "../../ui/MoodChip";

export interface Reaction {
  seat: number;
  customer: Customer;
  face: Face;
  outcome: Outcome;
  until: number;
  /** Coins paid (price plus tip) when the customer was served. */
  coins?: number;
}

export function portraitSlot(customer: Customer): string {
  return customer.kind === "regular" && customer.regularId !== null
    ? regularPrefix(getRegular(customer.regularId).id)
    : walkinId(customer.look);
}

export interface SeatsProps {
  state: ShiftState;
  reactions: readonly Reaction[];
  onSelect: (seat: number) => void;
}

function SeatView({
  index,
  seat,
  active,
  onSelect,
}: {
  index: number;
  seat: SeatState;
  active: boolean;
  onSelect: (seat: number) => void;
}) {
  const motion = useMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const customer = seat.customer;
  const order = seat.order;
  const customerId = customer?.id ?? null;
  const seconds = secondsLeft(seat.patienceLeft);
  const low = customer !== null && !seat.patienceFree && seconds < 10;

  // biome-ignore lint/correctness/useExhaustiveDependencies: slide in once per customer
  useEffect(() => {
    if (buttonRef.current && customerId !== null) void motion.customerArrive(buttonRef.current);
  }, [customerId]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: one beat per whole second under 10 s
  useEffect(() => {
    if (low && barRef.current) void motion.patiencePulse(barRef.current);
  }, [low, seconds]);

  if (customer === null || order === null) return null;
  const fraction = seat.patienceTotal > 0 ? seat.patienceLeft / seat.patienceTotal : 1;
  const name = customerName(customer);
  const selected = active ? t("shiftSelected") : "";
  const label = seat.patienceFree
    ? t("shiftSeatFree", { n: index + 1, name, order: orderText(order), selected })
    : t("shiftSeatFull", { n: index + 1, name, order: orderText(order), seconds, selected });
  return (
    <button
      ref={buttonRef}
      type="button"
      class={`tlw-seat${active ? " tlw-seat--active" : ""}${low ? " tlw-seat--low" : ""}`}
      aria-pressed={active}
      aria-label={label}
      data-seat={index}
      onClick={() => onSelect(index)}
    >
      <Portrait slot={portraitSlot(customer)} mood={seat.face} class="tlw-seat__face" />
      <span class="tlw-seat__name" aria-hidden="true">
        {name}
      </span>
      <span class="tlw-seat__order" aria-hidden="true">
        <ItemIcon slot={order.drink} />
        {order.pastry !== null ? <ItemIcon slot={order.pastry} /> : null}
        {order.mood !== null ? <MoodChip mood={order.mood} /> : null}
      </span>
      <span ref={barRef} class="tlw-patience" aria-hidden="true" data-testid={`patience-${index}`}>
        <span class="tlw-patience__track">
          <span class="tlw-patience__fill" style={{ width: `${Math.round(fraction * 100)}%` }} />
        </span>
        {low ? (
          <span class="tlw-patience__num">
            <Glyph name="clock" size={14} /> {t("shiftSecondsLeft", { seconds })}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function CoinPop({ coins }: { coins: number }) {
  const motion = useMotion();
  const ref = useRef<HTMLSpanElement>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: pop once when the chip appears
  useEffect(() => {
    if (ref.current) void motion.coinPop(ref.current);
  }, []);
  return (
    <span ref={ref} class="tlw-coinpop" aria-hidden="true" data-testid="coin-pop">
      +{coins}
    </span>
  );
}

export function Seats({ state, reactions, onSelect }: SeatsProps) {
  return (
    <div class="tlw-seats">
      {state.seats.map((seat, index) => {
        if (seat.customer !== null) {
          return (
            <SeatView
              key={index}
              index={index}
              seat={seat}
              active={state.active === index}
              onSelect={onSelect}
            />
          );
        }
        const ghost = reactions.find((item) => item.seat === index && item.until > state.tick);
        if (ghost) {
          return (
            <button
              key={index}
              type="button"
              class="tlw-seat tlw-seat--ghost"
              disabled
              aria-label={`${t("shiftSeat", { n: index + 1 })}: ${customerName(ghost.customer)} is ${OUTCOME_WORDS[ghost.outcome].toLowerCase()}`}
            >
              <Portrait
                slot={portraitSlot(ghost.customer)}
                mood={ghost.face}
                class="tlw-seat__face"
              />
              <span class="tlw-seat__name" aria-hidden="true">
                {OUTCOME_WORDS[ghost.outcome]}
              </span>
              {ghost.coins ? <CoinPop coins={ghost.coins} /> : null}
            </button>
          );
        }
        return (
          <button
            key={index}
            type="button"
            class="tlw-seat tlw-seat--empty"
            disabled
            aria-label={t("shiftSeatEmpty", { n: index + 1 })}
          >
            <span class="tlw-seat__name" aria-hidden="true">
              {t("shiftSeat", { n: index + 1 })}
            </span>
          </button>
        );
      })}
    </div>
  );
}
