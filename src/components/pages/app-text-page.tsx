/**
 * @fileoverview App Text Page
 * @description Reusable page component for text-heavy content like Privacy Policy, Terms, etc.
 *
 * This component uses Section internally for proper page layout.
 * Do NOT wrap this component in a Section when consuming it.
 */

import React, { type ReactNode, type ComponentType } from 'react';
import { Section } from '@sudobility/components';
import { cn } from '../../utils';
import { ui, colors } from '@sudobility/design';

/**
 * Configuration for a text section with paragraph content
 */
export interface TextSectionWithContent {
  /** Section title */
  title: string;
  /** Paragraph content */
  content: string;
  /** Whether content contains HTML that should be rendered */
  isHtml?: boolean;
}

/**
 * Configuration for a text section with a list
 */
export interface TextSectionWithList {
  /** Section title */
  title: string;
  /** Optional description before the list */
  description?: string;
  /** List items */
  items: string[];
  /** Optional additional content after the list */
  additionalContent?: string;
}

/**
 * Configuration for a text section with subsections (e.g., "Information You Provide" and "Information Collected Automatically")
 */
export interface TextSectionWithSubsections {
  /** Section title */
  title: string;
  /** Subsections, each with a title and list items */
  subsections: Array<{
    title: string;
    items: string[];
  }>;
}

/**
 * Union type for all section types
 */
export type TextSection =
  TextSectionWithContent | TextSectionWithList | TextSectionWithSubsections;

/**
 * Contact information configuration
 */
export interface TextPageContactInfo {
  /** Email label (e.g., "Email:") */
  emailLabel: string;
  /** Email address */
  email: string;
  /** Website label (e.g., "Website:") */
  websiteLabel: string;
  /** Website URL */
  websiteUrl: string;
  /** Data Protection Officer label (optional, for privacy pages) */
  dpoLabel?: string;
  /** DPO email (optional, for privacy pages) */
  dpoEmail?: string;
}

/**
 * GDPR notice configuration (optional, for privacy pages)
 */
export interface GdprNotice {
  /** GDPR section title */
  title: string;
  /** GDPR section content */
  content: string;
}

/**
 * Contact section configuration
 */
export interface TextPageContact {
  /** Section title */
  title: string;
  /** Section description */
  description: string;
  /** Whether description contains HTML */
  isHtml?: boolean;
  /** Contact details */
  info: TextPageContactInfo;
  /** Optional GDPR notice (for privacy pages) */
  gdprNotice?: GdprNotice;
}

/**
 * All text content for the text page
 */
export interface TextPageContent {
  /** Page title */
  title: string;
  /** Last updated text (use {{date}} as placeholder for the date) */
  lastUpdated?: string;
  /** All sections in order */
  sections: TextSection[];
  /** Contact information (optional) */
  contact?: TextPageContact;
}

/**
 * Props for AppTextPage component
 */
export interface AppTextPageProps {
  /** All text content (must be provided by consumer) */
  text: TextPageContent;
  /** Current date for "last updated" display */
  lastUpdatedDate?: string;
  /** Optional wrapper component for the page layout */
  PageWrapper?: ComponentType<{ children: ReactNode }>;
  /** Optional className for the container */
  className?: string;
}

/**
 * Type guard to check if section has items (is a list section)
 */
function isSectionWithList(
  section: TextSection
): section is TextSectionWithList {
  return 'items' in section && Array.isArray(section.items);
}

/**
 * Type guard to check if section has subsections
 */
function isSectionWithSubsections(
  section: TextSection
): section is TextSectionWithSubsections {
  return 'subsections' in section && Array.isArray(section.subsections);
}

/**
 * Heading component for h2 sections
 */
const SectionHeading: React.FC<{ children: ReactNode }> = ({ children }) => (
  <h2 className={`text-2xl font-bold ${ui.text.strong} mt-8 mb-4`}>
    {children}
  </h2>
);

/**
 * Heading component for h3 subsections
 */
const SubsectionHeading: React.FC<{ children: ReactNode }> = ({ children }) => (
  <h3 className={`text-xl font-semibold ${ui.text.strong} mt-6 mb-3`}>
    {children}
  </h3>
);

/**
 * Paragraph component
 */
const Paragraph: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <p className={cn(ui.text.body, 'mb-6', className)}>{children}</p>;

/**
 * List component - renders items with HTML support
 */
const List: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className={`list-disc list-inside ${ui.text.body} mb-6 space-y-1`}>
    {items.map((item, index) => (
      <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
    ))}
  </ul>
);

/**
 * AppTextPage - A reusable text page component for legal/informational pages
 *
 * Displays a text-heavy page with:
 * - Flexible section structure (content, list, or subsections)
 * - Optional contact information
 * - Optional GDPR notice
 *
 * Use this for Privacy Policy, Terms of Service, Cookie Policy, etc.
 *
 * @example
 * ```tsx
 * <AppTextPage
 *   text={{
 *     title: "Privacy Policy",
 *     lastUpdated: "Last updated: {{date}}",
 *     sections: [
 *       { title: "Introduction", content: "We respect your privacy..." },
 *       { title: "Data We Collect", items: ["Email", "Usage data"] },
 *       {
 *         title: "Information We Collect",
 *         subsections: [
 *           { title: "You Provide", items: ["Email", "Name"] },
 *           { title: "Automatic", items: ["IP", "Browser"] }
 *         ]
 *       }
 *     ],
 *     contact: {
 *       title: "Contact",
 *       description: "Questions?",
 *       info: { emailLabel: "Email:", email: "support@example.com", ... }
 *     }
 *   }}
 *   lastUpdatedDate="January 1, 2025"
 * />
 * ```
 */
export const AppTextPage: React.FC<AppTextPageProps> = ({
  text,
  lastUpdatedDate = new Date().toLocaleDateString(),
  PageWrapper,
  className,
}) => {
  const content = (
    <Section spacing='3xl' maxWidth='4xl' className={cn(className)}>
      <h1 className={`text-4xl font-bold ${ui.text.strong} mb-8`}>
        {text.title}
      </h1>

      <div className='prose prose-lg dark:prose-invert max-w-none'>
        {text.lastUpdated && (
          <Paragraph className='mb-6'>
            {text.lastUpdated.replace('{{date}}', lastUpdatedDate)}
          </Paragraph>
        )}

        {/* Render all sections */}
        {text.sections.map((section, index) => (
          <React.Fragment key={index}>
            <SectionHeading>{section.title}</SectionHeading>

            {isSectionWithSubsections(section) ? (
              // Section with subsections (h3 + lists)
              <>
                {section.subsections.map((subsection, subIndex) => (
                  <React.Fragment key={subIndex}>
                    <SubsectionHeading>{subsection.title}</SubsectionHeading>
                    <List items={subsection.items} />
                  </React.Fragment>
                ))}
              </>
            ) : isSectionWithList(section) ? (
              // Section with list
              <>
                {section.description && (
                  <Paragraph className='mb-4'>{section.description}</Paragraph>
                )}
                <List items={section.items} />
                {section.additionalContent && (
                  <Paragraph>{section.additionalContent}</Paragraph>
                )}
              </>
            ) : section.isHtml ? (
              // Section with HTML content
              <Paragraph>
                <span dangerouslySetInnerHTML={{ __html: section.content }} />
              </Paragraph>
            ) : (
              // Section with plain text content
              <Paragraph>{section.content}</Paragraph>
            )}
          </React.Fragment>
        ))}

        {/* Contact Section */}
        {text.contact && (
          <>
            <SectionHeading>{text.contact.title}</SectionHeading>
            {text.contact.isHtml ? (
              <Paragraph>
                <span
                  dangerouslySetInnerHTML={{ __html: text.contact.description }}
                />
              </Paragraph>
            ) : (
              <Paragraph>{text.contact.description}</Paragraph>
            )}
            <div className={`${ui.background.subtle} p-4 rounded-lg`}>
              <p className={ui.text.body}>
                {text.contact.info.emailLabel}{' '}
                <a
                  href={`mailto:${text.contact.info.email}`}
                  className={ui.text.link}
                >
                  {text.contact.info.email}
                </a>
                <br />
                {text.contact.info.websiteLabel}{' '}
                <a href={text.contact.info.websiteUrl} className={ui.text.link}>
                  {text.contact.info.websiteUrl}
                </a>
                {text.contact.info.dpoLabel && text.contact.info.dpoEmail && (
                  <>
                    <br />
                    {text.contact.info.dpoLabel}{' '}
                    <a
                      href={`mailto:${text.contact.info.dpoEmail}`}
                      className={ui.text.link}
                    >
                      {text.contact.info.dpoEmail}
                    </a>
                  </>
                )}
              </p>
            </div>

            {/* GDPR Notice */}
            {text.contact.gdprNotice && (
              <div
                className={`mt-8 p-4 ${colors.component.alert.info.base} ${colors.component.alert.info.dark} rounded-lg`}
              >
                <h3 className={`text-lg font-semibold ${ui.text.info} mb-2`}>
                  {text.contact.gdprNotice.title}
                </h3>
                <p className={ui.text.info}>
                  {text.contact.gdprNotice.content}{' '}
                  {text.contact.info.dpoEmail && (
                    <a
                      href={`mailto:${text.contact.info.dpoEmail}`}
                      className={ui.text.link}
                    >
                      {text.contact.info.dpoEmail}
                    </a>
                  )}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Section>
  );

  if (PageWrapper) {
    return <PageWrapper>{content}</PageWrapper>;
  }

  return content;
};

export default AppTextPage;
