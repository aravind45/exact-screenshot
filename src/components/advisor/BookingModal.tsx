import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    CardElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, CreditCard, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import stripePromise from '@/lib/stripe';
import { cn } from '@/lib/utils';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    advisor: any;
    user: any;
}

const BookingForm = ({ advisor, onClose, user }: { advisor: any; onClose: () => void; user: any }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [duration, setDuration] = useState('1');
    const [estates, setEstates] = useState<any[]>([]);
    const [selectedEstate, setSelectedEstate] = useState<string>('');
    const [step, setStep] = useState<'details' | 'payment'>('details');

    const hourlyRate = Number(advisor.hourlyRate);
    const totalAmount = hourlyRate * Number(duration);
    const platformFee = totalAmount * 0.20;
    const grandTotal = totalAmount; // In our model, totalAmount already includes everything or is the final price

    useEffect(() => {
        const fetchEstates = async () => {
            try {
                const response = await api.estates.list();
                setEstates(response || []);
                if (response?.length > 0) {
                    setSelectedEstate(response[0].id);
                }
            } catch (error) {
                console.error('Error fetching estates:', error);
            }
        };
        fetchEstates();
    }, []);

    const handleNextToPayment = () => {
        if (!date) {
            toast.error('Please select a date');
            return;
        }
        setStep('payment');
    };

    const handleSubmitPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements || !date) return;

        setLoading(true);

        try {
            // 1. Create booking
            const booking = await api.bookings.create({
                advisorId: advisor.id,
                estateId: selectedEstate || undefined,
                sessionDuration: Number(duration),
                sessionDate: date.toISOString(),
            });

            // 2. Create payment intent
            const { clientSecret } = await api.bookings.createPaymentIntent(booking.id);

            // 3. Confirm payment
            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement)!,
                    billing_details: {
                        name: user?.fullName || '',
                        email: user?.email,
                    },
                },
            });

            if (error) {
                toast.error(error.message || 'Payment failed');
                setLoading(false);
            } else if (paymentIntent.status === 'succeeded') {
                toast.success('Booking confirmed and payment successful!');
                onClose();
            }
        } catch (error: any) {
            toast.error(error.message || 'Something went wrong');
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 pt-4">
            {step === 'details' ? (
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="date">Select Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                    disabled={(date) => date < new Date()}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="duration">Session Duration (Hours)</Label>
                        <Select value={duration} onValueChange={setDuration}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                                    <SelectItem key={h} value={h.toString()}>
                                        {h} {h === 1 ? 'Hour' : 'Hours'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="estate">Select Estate (Optional)</Label>
                        <Select value={selectedEstate} onValueChange={setSelectedEstate}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose an estate" />
                            </SelectTrigger>
                            <SelectContent>
                                {estates.map((estate) => (
                                    <SelectItem key={estate.id} value={estate.id}>
                                        {estate.name} ({estate.deceasedFirstName} {estate.deceasedLastName})
                                    </SelectItem>
                                ))}
                                <SelectItem value="none">No specific estate</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="bg-muted p-4 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Hourly Rate</span>
                            <span>${hourlyRate.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Duration</span>
                            <span>{duration} {Number(duration) === 1 ? 'Hour' : 'Hours'}</span>
                        </div>
                        <div className="flex justify-between font-bold pt-2 border-t">
                            <span>Total Amount</span>
                            <span>${grandTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <Button className="w-full" onClick={handleNextToPayment}>
                        Continue to Payment
                    </Button>
                </div>
            ) : (
                <form onSubmit={handleSubmitPayment} className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg mb-4 text-sm space-y-1">
                        <p><strong>Advisor:</strong> {advisor.user.fullName}</p>
                        <p><strong>Date:</strong> {date ? format(date, "PPP") : ''}</p>
                        <p><strong>Duration:</strong> {duration} Hours</p>
                        <p className="pt-1 font-bold"><strong>Amount to Pay:</strong> ${grandTotal.toFixed(2)}</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Card Details</Label>
                        <div className="p-3 border rounded-md bg-white">
                            <CardElement
                                options={{
                                    style: {
                                        base: {
                                            fontSize: '16px',
                                            color: '#424770',
                                            '::placeholder': {
                                                color: '#aab7c4',
                                            },
                                        },
                                        invalid: {
                                            color: '#9e2146',
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setStep('details')}
                            disabled={loading}
                        >
                            Back
                        </Button>
                        <Button type="submit" className="flex-1" disabled={!stripe || loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Pay ${grandTotal.toFixed(2)}
                                </>
                            )}
                        </Button>
                    </div>

                    <p className="text-[10px] text-center text-muted-foreground">
                        Your payment is secure. Funds will be held in escrow until the session is completed or for 90 days.
                    </p>
                </form>
            )}
        </div>
    );
};

export function BookingModal({ isOpen, onClose, advisor, user }: BookingModalProps) {
    if (!advisor) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Book a Consultation</DialogTitle>
                    <DialogDescription>
                        Schedule a session with {advisor.user.fullName}.
                    </DialogDescription>
                </DialogHeader>
                <Elements stripe={stripePromise}>
                    <BookingForm advisor={advisor} onClose={onClose} user={user} />
                </Elements>
            </DialogContent>
        </Dialog>
    );
}
