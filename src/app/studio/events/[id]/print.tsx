import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CoverImage } from '@/components/cover-image';
import { Logo } from '@/components/logo';
import { QrCode } from '@/components/qr-code';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/ui/screen-state';
import { C, Fonts } from '@/constants/theme';
import { useFocusedAsync } from '@/hooks/use-async';
import { fetchEvent } from '@/lib/events';
import { inviteUrl } from '@/lib/invite';

// A4 at 96 dpi, so the on-screen preview matches the printed page.
const SHEET_WIDTH = 794;
const SHEET_HEIGHT = 1123;
const POSTER_QR = 340;
const CARD_QR = 170;
const INK = '#141414';
const INK_SOFT = '#5b5650';
const PAPER = '#f7f3ea';

// react-native-web can't express print rules, so they live in a plain
// stylesheet that targets the ids below.
const PRINT_CSS = `
@page { size: A4; margin: 0; }
@media print {
  html, body { background: #ffffff !important; }
  /* The app shell is a full-height, clipped flex stack, which would cut printing off after one page. */
  html, body, *:has(#print-root) {
    display: block !important;
    position: static !important;
    height: auto !important;
    overflow: visible !important;
  }
  #print-controls { display: none !important; }
  #print-root { display: block !important; background: #ffffff !important; padding: 0 !important; }
  [id^="print-sheet"] {
    margin: 0 !important;
    box-shadow: none !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  /* Only between sheets: a break after the last one prints a blank page. */
  #print-sheet-poster { break-after: page; }
}
`;

const TABLE_CARDS = 4;

function TableCard({ name, url }: { name: string; url: string }) {
  return (
    <View style={styles.tableCard}>
      <Text style={styles.cardEyebrow}>Shoot the night with us</Text>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {name}
      </Text>
      <QrCode value={url} size={CARD_QR} />
      <Text style={styles.cardHint}>Scan with your phone camera</Text>
    </View>
  );
}

export default function PrintKitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: event, error, isLoading, reload } = useFocusedAsync(() => fetchEvent(id), [id]);

  if (event === undefined && isLoading) return <LoadingState />;
  if (event === undefined) return <ErrorState message={error ?? 'Unknown error'} onRetry={reload} />;
  if (event === null || event.myRole !== 'owner') {
    return <ErrorState message="This event doesn't exist or isn't one of yours." onRetry={reload} />;
  }

  const url = inviteUrl(event.inviteCode);

  return (
    <ScrollView style={styles.page}>
      <style>{PRINT_CSS}</style>
      <View style={styles.root} nativeID="print-root">
        <View style={styles.controls} nativeID="print-controls">
          <Button label="Back" variant="outline" size="sm" onPress={() => router.back()} />
          <Text style={styles.controlsText}>
            Print, or choose “Save as PDF” in the print dialog. Use A4 paper with no margins.
          </Text>
          <Button label="Print" size="sm" onPress={() => window.print()} />
        </View>

        <View style={styles.sheet} nativeID="print-sheet-poster">
          <CoverImage cover={event.cover} style={styles.posterCover} />
          <View style={styles.posterBody}>
            <Text style={styles.posterEyebrow}>Everyone shoots. Nobody peeks.</Text>
            <Text style={styles.posterTitle} numberOfLines={2}>
              {event.name}
            </Text>
            <View style={styles.posterQr}>
              <QrCode value={url} size={POSTER_QR} />
            </View>
            <Text style={styles.posterCall}>Scan to join the roll</Text>
            <Text style={styles.posterSteps}>
              Open your phone camera, point it at the code and tap the link.{'\n'}Your photos develop
              with everyone else’s after the event.
            </Text>
            <Text style={styles.posterCode}>Or enter code {event.inviteCode}</Text>
            <View style={styles.posterBrand}>
              <Logo size={24} />
              <Text style={styles.posterBrandText}>Ikausa</Text>
            </View>
          </View>
        </View>

        <View style={[styles.sheet, styles.cardSheet]} nativeID="print-sheet-cards">
          {Array.from({ length: TABLE_CARDS }, (_, i) => (
            <TableCard key={i} name={event.name} url={url} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.background },
  root: { alignItems: 'center', gap: 32, padding: 32 },
  controls: {
    width: SHEET_WIDTH,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  controlsText: { flex: 1, fontFamily: Fonts.hanken, fontSize: 14, color: C.textSoft },

  sheet: {
    width: SHEET_WIDTH,
    height: SHEET_HEIGHT,
    backgroundColor: PAPER,
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },

  posterCover: { width: '100%', height: 300 },
  posterBody: { flex: 1, alignItems: 'center', paddingHorizontal: 64, paddingTop: 40, gap: 14 },
  posterEyebrow: {
    fontFamily: Fonts.hanken,
    fontSize: 13,
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: INK_SOFT,
  },
  posterTitle: {
    fontFamily: Fonts.playfair,
    fontSize: 52,
    lineHeight: 60,
    color: INK,
    textAlign: 'center',
  },
  posterQr: { padding: 18, marginTop: 6, borderRadius: 20, backgroundColor: '#ffffff' },
  posterCall: { fontFamily: Fonts.playfairItalic, fontSize: 32, lineHeight: 40, color: INK },
  posterSteps: {
    fontFamily: Fonts.hanken,
    fontSize: 15,
    lineHeight: 23,
    color: INK_SOFT,
    textAlign: 'center',
  },
  posterCode: {
    fontFamily: Fonts.hanken,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: INK,
  },
  posterBrand: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 'auto', marginBottom: 36 },
  posterBrandText: { fontFamily: Fonts.playfair, fontSize: 18, color: INK },

  cardSheet: { flexDirection: 'row', flexWrap: 'wrap' },
  tableCard: {
    width: SHEET_WIDTH / 2,
    height: SHEET_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 36,
    borderWidth: 0.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(20,20,20,0.25)',
  },
  cardEyebrow: {
    fontFamily: Fonts.hanken,
    fontSize: 11,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: INK_SOFT,
  },
  cardTitle: {
    fontFamily: Fonts.playfair,
    fontSize: 28,
    lineHeight: 34,
    color: INK,
    textAlign: 'center',
  },
  cardHint: { fontFamily: Fonts.playfairItalic, fontSize: 16, color: INK },
});
