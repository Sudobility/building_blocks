import React, { useCallback, type ComponentType } from 'react';
import {
  Footer as FooterContainer,
  FooterSocialLinks,
} from '@sudobility/components';
import { cn } from '../../utils';
import type {
  StatusIndicatorConfig,
  LinkComponentProps,
  FooterLinkSection as FooterLinkSectionConfig,
  SocialLinksConfig,
  AnalyticsTrackingParams,
} from '../../types';
import type { SystemStatusIndicatorProps } from './app-footer';
import { DefaultLinkComponent, getCopyrightYear } from './shared';

export interface AppFooterForHomePageProps {
  /** App logo configuration */
  logo: {
    /** Logo image src (optional - if not provided, uses Logo component) */
    src?: string;
    /** App name */
    appName: string;
  };

  /** Footer link sections displayed as horizontal rows */
  linkSections: FooterLinkSectionConfig[];

  /** Social media links */
  socialLinks?: SocialLinksConfig;

  /** System status indicator configuration */
  statusIndicator?: StatusIndicatorConfig;

  /**
   * SystemStatusIndicator component from @sudobility/components/devops.
   * Pass this to enable status indicator functionality.
   */
  StatusIndicatorComponent?: ComponentType<SystemStatusIndicatorProps>;

  /** App version string */
  version?: string;

  /** Copyright year or range */
  copyrightYear?: string;

  /** Company name for copyright */
  companyName: string;

  /** Company link URL (optional) */
  companyUrl?: string;

  /** Footer description text (tagline below logo) */
  description?: string;

  /** Rights text (e.g., "All rights reserved") */
  rightsText?: string;

  /** Custom Link component */
  LinkComponent?: ComponentType<LinkComponentProps>;

  /** Network online status (for status indicator) */
  isNetworkOnline?: boolean;

  /** Custom className */
  className?: string;

  /** Optional analytics tracking callback */
  onTrack?: (params: AnalyticsTrackingParams) => void;
}

/**
 * AppFooterForHomePage - Full footer for home/landing pages.
 *
 * Displays link sections as horizontal rows with section title in bold,
 * followed by links that wrap to additional lines as needed.
 * Below the sitemap, shows app name, tagline, version, and copyright
 * on a single wrapping line.
 *
 * @example
 * ```tsx
 * <AppFooterForHomePage
 *   logo={{ appName: 'My App' }}
 *   linkSections={[
 *     {
 *       title: 'Product',
 *       links: [
 *         { label: 'Features', href: '/features' },
 *         { label: 'Pricing', href: '/pricing' },
 *       ],
 *     },
 *   ]}
 *   version="1.0.0"
 *   companyName="Sudobility Inc."
 *   description="Building the future"
 * />
 * ```
 */
export const AppFooterForHomePage: React.FC<AppFooterForHomePageProps> = ({
  logo,
  linkSections,
  socialLinks,
  statusIndicator,
  StatusIndicatorComponent,
  version,
  copyrightYear,
  companyName,
  companyUrl,
  description,
  rightsText = 'All rights reserved',
  LinkComponent = DefaultLinkComponent,
  isNetworkOnline = true,
  className,
  onTrack,
}) => {
  const year = copyrightYear || getCopyrightYear();

  const track = useCallback(
    (label: string, params?: Record<string, unknown>) => {
      onTrack?.({
        eventType: 'link_click',
        componentName: 'AppFooterForHomePage',
        label,
        params,
      });
    },
    [onTrack]
  );

  const createTrackedLinkHandler = useCallback(
    (
      linkLabel: string,
      linkHref: string,
      sectionTitle: string,
      originalOnClick?: (e: React.MouseEvent) => void
    ) =>
      (e: React.MouseEvent) => {
        track('footer_link_clicked', {
          link_label: linkLabel,
          link_href: linkHref,
          section_title: sectionTitle,
        });
        originalOnClick?.(e);
      },
    [track]
  );

  return (
    <FooterContainer variant='full' className={cn(className)}>
      <nav
        role='navigation'
        aria-label='Footer Navigation'
        className='space-y-1'
      >
        {linkSections.map((section, sectionIndex) => (
          <div
            key={section.title || sectionIndex}
            className='flex flex-wrap items-baseline gap-y-0.5'
          >
            <span className='font-bold text-xs text-muted-foreground mr-2'>
              {section.title}
            </span>
            {section.links.map((link, linkIndex) => (
              <React.Fragment key={link.href || linkIndex}>
                {linkIndex > 0 && (
                  <span className='text-muted-foreground mx-1.5'>·</span>
                )}
                {link.onClick ? (
                  <button
                    onClick={createTrackedLinkHandler(
                      link.label,
                      link.href,
                      section.title,
                      link.onClick
                    )}
                    className='text-xs text-muted-foreground hover:text-foreground transition-colors'
                  >
                    {link.label}
                  </button>
                ) : (
                  <LinkComponent
                    href={link.href}
                    onClick={createTrackedLinkHandler(
                      link.label,
                      link.href,
                      section.title
                    )}
                    className='text-xs text-muted-foreground hover:text-foreground transition-colors'
                  >
                    {link.label}
                  </LinkComponent>
                )}
              </React.Fragment>
            ))}
          </div>
        ))}
      </nav>

      <div className='border-t border-border mt-4 pt-3'>
        <div className='flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground'>
          <span className='font-semibold text-muted-foreground'>
            {logo.appName}
          </span>
          {description && (
            <>
              <span className='text-muted-foreground'>·</span>
              <span>{description}</span>
            </>
          )}
          {version && (
            <>
              <span className='text-muted-foreground'>·</span>
              <span>v{version}</span>
            </>
          )}
          <span className='text-muted-foreground'>·</span>
          <span>
            © {year}{' '}
            {companyUrl ? (
              <LinkComponent
                href={companyUrl}
                className='text-muted-foreground hover:text-foreground transition-colors'
              >
                {companyName}
              </LinkComponent>
            ) : (
              companyName
            )}
            . {rightsText}
          </span>
          {statusIndicator && StatusIndicatorComponent && (
            <>
              <span className='text-muted-foreground'>·</span>
              <StatusIndicatorComponent
                statusPageUrl={statusIndicator.statusPageUrl}
                apiEndpoint={statusIndicator.apiEndpoint}
                refreshInterval={statusIndicator.refreshInterval || 60000}
                size='sm'
                version={version}
                isNetworkOnline={isNetworkOnline}
              />
            </>
          )}
        </div>
      </div>

      {socialLinks && (
        <div className='flex justify-center mt-3'>
          <FooterSocialLinks
            twitterUrl={socialLinks.twitterUrl}
            discordUrl={socialLinks.discordUrl}
            linkedinUrl={socialLinks.linkedinUrl}
            githubUrl={socialLinks.githubUrl}
            redditUrl={socialLinks.redditUrl}
            farcasterUrl={socialLinks.farcasterUrl}
            telegramUrl={socialLinks.telegramUrl}
          />
        </div>
      )}
    </FooterContainer>
  );
};

export default AppFooterForHomePage;
