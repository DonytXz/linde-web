import { useState, type FormEvent } from "react";
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { api } from "../api";
import type { Booking, PaymentIntent } from "../api/types";
import { Alert, ErrorNotice, Icon } from "../components/ui";
import { idempotencyKey } from "../lib/format";
import { useUi } from "../lib/hooks";

const publicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = publicKey.startsWith("pk_")
  ? loadStripe(publicKey)
  : null;

export default function Payment({
  booking,
  onSubmitted,
}: {
  booking: Booking;
  onSubmitted: () => void;
}) {
  const { t, lang } = useUi();
  const [intent, setIntent] = useState<PaymentIntent>();
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  async function start() {
    setBusy(true);
    setError(undefined);
    try {
      setIntent(
        await api.payment(
          booking.id,
          booking.version,
          idempotencyKey(`payment:${booking.id}:${booking.version}`),
        ),
      );
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  if (!stripePromise) return <Alert>{t("paymentUnavailable")}</Alert>;
  return (
    <div className="payment-panel">
      <h3>{t("payTitle")}</h3>
      {Boolean(error) && <ErrorNotice error={error} retry={start} />}
      {intent ? (
        <Elements stripe={stripePromise} options={{ locale: lang }}>
          <CardPayment intent={intent} onSubmitted={onSubmitted} />
        </Elements>
      ) : (
        <button className="button full" disabled={busy} onClick={start}>
          {t(busy ? "loading" : "pay")}
          <Icon name="lock" size={17} />
        </button>
      )}
      <p className="fine-print">{t("securePayment")}</p>
    </div>
  );
}
function CardPayment({
  intent,
  onSubmitted,
}: {
  intent: PaymentIntent;
  onSubmitted: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useUi();
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const card = elements?.getElement(CardElement);
    if (!stripe || !card || busy || submitted) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await stripe.confirmCardPayment(intent.clientSecret, {
        payment_method: { card },
      });
      if (result.error) setMessage(result.error.message || t("error"));
      else {
        setSubmitted(true);
        onSubmitted();
      }
    } catch {
      setMessage(t("network"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <p className="field-title">{t("card")}</p>
      <div className="card-field">
        <CardElement
          options={{
            hidePostalCode: true,
            style: { base: { fontSize: "16px", color: "#173e3b" } },
          }}
          onChange={(event) => {
            setComplete(event.complete);
            setMessage(event.error?.message || "");
          }}
        />
      </div>
      {message && <Alert kind="error">{message}</Alert>}
      {submitted ? (
        <Alert>{t("processing")}</Alert>
      ) : (
        <button className="button full" disabled={!stripe || !complete || busy}>
          {t(busy ? "loading" : "payNow")}
          <Icon name="lock" size={17} />
        </button>
      )}
    </form>
  );
}
