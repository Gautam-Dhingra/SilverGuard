import { describe, it, expect } from 'vitest';

describe('Doctor Appointment Booking & Travel Logistics Helper', () => {
  it('formats clean WhatsApp share summary with travel logistics', () => {
    const generateBookingSummary = (booking: {
      specialist: string;
      doctorName: string;
      appointmentDate: string;
      appointmentTime: string;
      clinicAddress: string;
      travelOption: 'cab' | 'family';
      familyEscortName?: string;
      cabPickupTime?: string;
    }) => {
      const travelDetails =
        booking.travelOption === 'cab'
          ? `🚗 Doorstep Cab: Confirmed (Pickup at ${booking.cabPickupTime || '30 mins before'} from home)`
          : `👨‍👩‍👧 Family Escort: Accompanied by ${booking.familyEscortName || 'Family member'}`;

      return `*SilverGuard Doctor Appointment Confirmation*
• Specialist: ${booking.specialist}
• Doctor: ${booking.doctorName}
• Date & Time: ${booking.appointmentDate} at ${booking.appointmentTime}
• Clinic: ${booking.clinicAddress}
• Travel: ${travelDetails}

Senior-Friendly Checklist:
1. Carry previous prescriptions and medical file.
2. Wear comfortable clothing and walking footwear.`;
    };

    const summaryCab = generateBookingSummary({
      specialist: 'Eye Specialist (Ophthalmologist)',
      doctorName: 'Dr. Anita Desai',
      appointmentDate: 'Tomorrow (20 Sep)',
      appointmentTime: '11:00 AM',
      clinicAddress: 'Netralaya Eye Clinic, Metro Pillar 42',
      travelOption: 'cab',
      cabPickupTime: '10:30 AM',
    });

    expect(summaryCab).toContain('Eye Specialist');
    expect(summaryCab).toContain('Doorstep Cab: Confirmed');
    expect(summaryCab).toContain('10:30 AM');

    const summaryFamily = generateBookingSummary({
      specialist: 'Orthopedic Doctor',
      doctorName: 'Dr. K. Sharma',
      appointmentDate: 'Monday (22 Sep)',
      appointmentTime: '4:30 PM',
      clinicAddress: 'Apollo Bone & Joint Centre',
      travelOption: 'family',
      familyEscortName: 'Son (Rahul)',
    });

    expect(summaryFamily).toContain('Orthopedic Doctor');
    expect(summaryFamily).toContain('Family Escort: Accompanied by Son (Rahul)');
  });

  it('calculates 30 minutes prior cab pickup time accurately', () => {
    const calculatePickupTime = (timeStr: string): string => {
      // Simple utility for 12hr time string (e.g. "11:00 AM" -> "10:30 AM")
      const [time, modifier] = timeStr.trim().split(' ');
      const [hourStr, minuteStr] = time.split(':');
      let hour = parseInt(hourStr, 10);
      let minute = parseInt(minuteStr, 10);

      minute -= 30;
      if (minute < 0) {
        minute += 60;
        hour -= 1;
        if (hour === 0) hour = 12;
      }

      const formattedMinute = minute.toString().padStart(2, '0');
      return `${hour}:${formattedMinute} ${modifier || 'AM'}`;
    };

    expect(calculatePickupTime('11:00 AM')).toBe('10:30 AM');
    expect(calculatePickupTime('4:00 PM')).toBe('3:30 PM');
    expect(calculatePickupTime('12:15 PM')).toBe('11:45 PM');
  });
});
