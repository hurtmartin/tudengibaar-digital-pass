import insukLogo from '../assets/organisers/logo-insuk-white.svg'
import itukLogo from '../assets/organisers/logo-ituk-white.svg'
import taltechLogo from '../assets/organisers/taltech_logo_valge.png'
import aLeCoqLogo from '../assets/sponsors/A_Le_Coq_white.png'
import anoraLogo from '../assets/sponsors/anora_white.svg'
import redbullLogo from '../assets/sponsors/redbull-text-white-cropped.png'

// width/height are the intrinsic ratios, so the row doesn't jump while logos load
const ORGANISERS = [
  { src: taltechLogo, alt: 'TalTech', width: 36, height: 20 },
  { src: itukLogo, alt: 'ITÜK', width: 80, height: 20 },
  { src: insukLogo, alt: 'INSÜK', width: 95, height: 20 },
]
const SPONSORS = [
  { src: anoraLogo, alt: 'Anora', width: 103, height: 20 },
  { src: redbullLogo, alt: 'Red Bull', width: 58, height: 20 },
  { src: aLeCoqLogo, alt: 'A. Le Coq', width: 54, height: 20 },
]

function LogoGroup({ logos, label }) {
  return (
    // `contents`: the group stays for screen readers, but its logos join the footer's single wrapping row
    <div role="group" aria-label={label} className="contents">
      {logos.map((logo) => (
        <img key={logo.alt} {...logo} className="h-5 w-auto opacity-80" />
      ))}
    </div>
  )
}

export default function Footer({ t }) {
  return (
    // Gaps are the logos' clear space: at least one logo height (20px) beside, most of one between rows
    <footer className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 border-t border-white/10 px-2 pt-4 pb-1">
      <LogoGroup logos={ORGANISERS} label={t.footerOrganizers} />
      <LogoGroup logos={SPONSORS} label={t.footerSponsors} />
    </footer>
  )
}
