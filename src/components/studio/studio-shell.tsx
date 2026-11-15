import { Link, usePathname, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Logo } from '@/components/logo';
import { useStudio } from '@/components/studio/studio-context';
import { C, Fonts, T } from '@/constants/theme';

const CONTENT_MAX_WIDTH = 1080;
/** Below this width (phones) Studio uses tighter gutters and a smaller title. */
const COMPACT_BREAKPOINT = 640;
const GUTTER = 24;
const COMPACT_GUTTER = 16;

/** Width of the content column for a window width, so pages can size grids to it. */
export function studioContentWidth(windowWidth: number): number {
  const gutter = windowWidth < COMPACT_BREAKPOINT ? COMPACT_GUTTER : GUTTER;
  return Math.min(windowWidth - gutter * 2, CONTENT_MAX_WIDTH);
}

interface StudioShellProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Buttons shown beside the title. */
  actions?: ReactNode;
  children: ReactNode;
}

function NavLink({ href, label }: { href: Href; label: string }) {
  const pathname = usePathname();
  // Only Admin has sub-pages; '/' and '/studio' would otherwise match every path below them.
  const isActive = href === '/studio/admin' ? pathname.startsWith(href) : pathname === href;
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityState={{ selected: isActive }}
        style={({ hovered }) => [styles.navLink, (isActive || hovered) && styles.navLinkActive]}>
        <Text style={[styles.navText, isActive && styles.navTextActive]}>{label}</Text>
      </Pressable>
    </Link>
  );
}

/** Desktop-first frame for Studio pages: top bar, then a centred content column. */
export function StudioShell({ eyebrow, title, subtitle, actions, children }: StudioShellProps) {
  const { status } = useStudio();
  const isCompact = useWindowDimensions().width < COMPACT_BREAKPOINT;

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, isCompact && styles.topBarCompact]}>
        <View style={styles.topInner}>
          <Link href="/studio" asChild>
            <Pressable accessibilityRole="link" accessibilityLabel="Studio home" style={styles.brand}>
              <Logo size={30} />
              <Text style={styles.brandText}>
                Ikausa <Text style={styles.brandStudio}>Studio</Text>
              </Text>
            </Pressable>
          </Link>
          <View style={styles.nav}>
            <NavLink href="/studio" label="Events" />
            {status.isAdmin && <NavLink href="/studio/admin" label="Admin" />}
            <NavLink href="/" label="Open app" />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, isCompact && styles.scrollCompact]}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              {eyebrow && <Text style={T.eyebrow}>{eyebrow}</Text>}
              <Text style={[styles.title, isCompact && styles.titleCompact]} accessibilityRole="header">
                {title}
              </Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            {actions && <View style={styles.actions}>{actions}</View>}
          </View>
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

interface StudioPanelProps {
  title: string;
  hint?: string;
  /** Small label above the title, e.g. "Next step". */
  eyebrow?: string;
  /** Highlights the one panel the organizer should look at first. */
  isFeatured?: boolean;
  children?: ReactNode;
}

/** A raised panel for grouping a section of a Studio page. */
export function StudioPanel({ title, hint, eyebrow, isFeatured = false, children }: StudioPanelProps) {
  return (
    <View style={[styles.panel, isFeatured && styles.panelFeatured]}>
      <View style={styles.panelHead}>
        {eyebrow && <Text style={[T.eyebrow, isFeatured && styles.panelEyebrowFeatured]}>{eyebrow}</Text>}
        <Text style={[styles.panelTitle, isFeatured && styles.panelTitleFeatured]}>{title}</Text>
        {hint && <Text style={styles.panelHint}>{hint}</Text>}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  topBar: {
    borderBottomWidth: 1,
    borderBottomColor: C.hairline,
    backgroundColor: C.surfaceLowest,
    paddingHorizontal: GUTTER,
  },
  topBarCompact: { paddingHorizontal: COMPACT_GUTTER },
  topInner: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 14,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandText: { fontFamily: Fonts.playfair, fontSize: 20, color: C.onSurface },
  brandStudio: { color: C.primary },
  nav: { flexDirection: 'row', gap: 4 },
  navLink: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  navLinkActive: { backgroundColor: C.surfaceHigh },
  navText: { ...T.caption, fontSize: 14, fontWeight: '600', color: C.textSoft },
  navTextActive: { color: C.onSurface },

  scroll: { flexGrow: 1, paddingHorizontal: GUTTER, paddingTop: 40, paddingBottom: 80 },
  scrollCompact: { paddingHorizontal: COMPACT_GUTTER, paddingTop: 24 },
  content: { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', gap: 28 },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerText: { gap: 8, flexShrink: 1 },
  title: { ...T.title, fontSize: 40, lineHeight: 48 },
  titleCompact: { fontSize: 30, lineHeight: 36 },
  subtitle: { ...T.bodyMd, color: C.textSoft, maxWidth: 560 },
  actions: { flexDirection: 'row', gap: 10 },

  panel: {
    padding: 24,
    gap: 18,
    borderRadius: 22,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.hairline,
  },
  panelFeatured: {
    padding: 28,
    backgroundColor: C.cardRaised,
    borderColor: 'rgba(255,196,153,0.45)',
  },
  panelHead: { gap: 4 },
  panelEyebrowFeatured: { color: C.primary },
  panelTitle: { ...T.title, fontSize: 22, lineHeight: 28 },
  panelTitleFeatured: { fontSize: 30, lineHeight: 38 },
  panelHint: { ...T.caption, fontSize: 14, lineHeight: 20, color: C.textSoft, maxWidth: 620 },
});
