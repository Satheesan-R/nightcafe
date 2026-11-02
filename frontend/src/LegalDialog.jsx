import { useEffect, useRef } from "react";

const privacy = [
  ["Information We Collect", "AYRA Juice Bar does not require visitors to create accounts or provide personal information to browse our website.", "If you voluntarily contact us through email, telephone, WhatsApp or social media, we may receive information such as your name, phone number and message."],
  ["How We Use Your Information", "Any information voluntarily provided by visitors may be used to:", ["Respond to customer questions and inquiries.", "Provide information about our products and services.", "Communicate with customers when necessary.", "Improve our customer service."]],
  ["Cookies and Website Usage", "Our website may use basic cookies or similar technologies to improve the browsing experience and understand how visitors interact with our website."],
  ["Third-Party Websites", "Our website may contain links to third-party platforms such as Facebook, Instagram, TikTok, WhatsApp and Google Maps.", "We are not responsible for the privacy practices or content of these external websites. Visitors should review their respective privacy policies."],
  ["Information Security", "We take reasonable steps to protect any personal information voluntarily shared with us. However, no method of internet transmission or electronic storage is completely secure."],
  ["Children's Privacy", "Our website is intended for general audiences. We do not knowingly collect personal information from children through our website."],
  ["Changes to This Privacy Policy", "We may update this Privacy Policy from time to time. Any changes will be published on this page with an updated revision date."],
];
const terms = [
  ["Website Purpose", "This website is designed to provide information about AYRA Juice Bar, including our products, menu, business information and contact details.", "The website is intended for viewing and informational purposes only. It does not provide online ordering, online payment or delivery booking services."],
  ["Product Information", "We make reasonable efforts to ensure that the product descriptions, images and menu information displayed on this website are accurate.", "However, actual product appearance, ingredients and availability may vary."],
  ["Menu and Pricing", "Menu items and prices displayed on the website are provided for general information. Prices, product availability and menu items may change without prior notice.", "Please contact AYRA Juice Bar directly for the latest information."],
  ["Intellectual Property", "All website content, including logos, photographs, graphics, text and design elements, belongs to AYRA Juice Bar or its respective content owners unless otherwise stated.", "Visitors may not reproduce, distribute, modify or use website content for commercial purposes without prior permission."],
  ["External Links", "Our website may contain links to external websites and social media platforms.", "We are not responsible for the content, availability or services provided by third-party websites."],
  ["Website Availability", "We aim to keep our website available and functioning properly. However, we do not guarantee uninterrupted access and may update, modify or temporarily suspend website features when necessary."],
  ["Limitation of Liability", "AYRA Juice Bar is not responsible for losses resulting from temporary website interruptions, inaccurate third-party information or the misuse of website content, to the extent permitted by applicable law."],
  ["Changes to These Terms", "We reserve the right to update these Terms & Conditions at any time. Updated terms will be published on this page."],
];

export default function LegalDialog({ policy, onClose }) {
  const ref = useRef(null);
  const isPrivacy = policy === "privacy";
  const sections = isPrivacy ? privacy : terms;
  useEffect(() => {
    if (!policy) return;
    const element = ref.current;
    element.scrollTop = 0;
    if (!element.open) element.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, [policy]);
  return <dialog ref={ref} className="legal-dialog" aria-labelledby="legal-title" onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
    <article>
      <button type="button" className="legal-close" aria-label="Close policy" autoFocus onClick={() => ref.current.close()}>✕</button>
      <h2 id="legal-title">{isPrivacy ? "Privacy Policy" : "Terms & Conditions"}</h2>
      <p><strong>Last Updated: October 2026</strong></p>
      <p>{isPrivacy ? "Welcome to AYRA Juice Bar. We respect your privacy and are committed to protecting any personal information you share with us when visiting our website." : "Welcome to the AYRA Juice Bar website. By accessing and using this website, you agree to the following Terms & Conditions."}</p>
      {sections.map(([heading, ...paragraphs], index) => <section key={heading}>
        <h3>{index + 1}. {heading}</h3>
        {paragraphs.map((paragraph, i) => Array.isArray(paragraph) ? <ul key={i}>{paragraph.map((item) => <li key={item}>{item}</li>)}</ul> : <p key={i}>{paragraph}</p>)}
      </section>)}
      <section>
        <h3>{sections.length + 1}. {isPrivacy ? "Contact Us" : "Contact Information"}</h3>
        <p>{isPrivacy ? "If you have any questions about this Privacy Policy, please contact us:" : "For questions regarding these Terms & Conditions, please contact:"}</p>
        <p><strong>Business Name:</strong> AYRA Juice Bar<br />
          
          <strong>Phone:</strong> <a href="tel:+94769400150">076 940 0150</a><br />
          <strong>Location:</strong> <a href="https://maps.app.goo.gl/9i9CEYnRwp2E6jrr5" target="_blank" rel="noopener noreferrer">Pachchilapalli, Sri Lanka</a></p>
      </section>
      <p>Thank you for visiting AYRA Juice Bar.</p>
    </article>
  </dialog>;
}
