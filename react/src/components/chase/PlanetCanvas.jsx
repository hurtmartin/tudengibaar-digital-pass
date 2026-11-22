import Planet from './Planet.jsx'
import RouteOverlay from './RouteOverlay.jsx'

export default function PlanetCanvas({ planets, solvedCount, statusOf, justSolved, t, onPlanet, children }) {
  const complete = solvedCount >= planets.length
  return (
    <div className="relative h-[220svh]">
      {children}
      <RouteOverlay planets={planets} solvedCount={solvedCount} drawIndex={justSolved} complete={complete} />
      {planets.map((planet, i) => {
        const status = statusOf(i)
        return (
          <Planet
            key={planet.id}
            planet={planet}
            index={i}
            status={status}
            unlocking={justSolved !== null && i === justSolved + 1}
            label={t.planetLabel(i + 1, status)}
            onClick={() => onPlanet(i)}
          />
        )
      })}
    </div>
  )
}
