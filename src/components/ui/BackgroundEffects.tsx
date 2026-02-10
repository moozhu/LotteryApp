import ShapeFireworks from './ShapeFireworks'

interface BackgroundEffectsProps {
  showFireworks?: boolean
  onFireworksComplete?: () => void
  auto?: boolean
  enableBackground?: boolean
  burstPoints?: Array<{ x: number; y: number }>
}

export default function BackgroundEffects({ 
  showFireworks, 
  onFireworksComplete,
  auto = true,
  enableBackground = true,
  burstPoints
}: BackgroundEffectsProps) {
  return (
    <>
      <ShapeFireworks 
        trigger={showFireworks} 
        onComplete={onFireworksComplete}
        auto={auto}
        enableBackground={enableBackground}
        burstPoints={burstPoints}
      />
    </>
  )
}
