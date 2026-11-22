import InfoTip, { InfoList } from '../InfoTip.jsx'

// The how-to opens as a panel over the dimmed page, so the card never resizes
export default function HowTo({ t }) {
  return (
    <div className="relative flex flex-col items-center">
      <InfoTip label={t.howTo} closeLabel={t.close} chevron>
        <InfoList items={t.howToSteps} note={t.disclaimer} />
      </InfoTip>
    </div>
  )
}
