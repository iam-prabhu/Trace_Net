import { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import {
  Globe as GlobeIcon,
  ShieldAlert,
  ArrowRight,
  RotateCw,
  Layers,
  Activity,
  Compass,
  DollarSign,
  TrendingUp,
  MapPin,
  CheckCircle2,
  ExternalLink,
  Target,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from '../utils/format';

export interface JurisdictionHub {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  volume: number;
  flaggedTxnCount: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  dominantTypology: string;
  fatfStatus: 'Blacklist' | 'Greylist' | 'Monitored' | 'Compliant';
  color: string;
}

export interface CrossBorderArc {
  id: string;
  fromId: string;
  toId: string;
  volume: number;
  txnCount: number;
  typology: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  color: string;
}

const GLOBAL_HUBS: JurisdictionHub[] = [
  {
    id: 'KY-GTO',
    name: 'George Town Offshore Vaults',
    country: 'Cayman Islands',
    lat: 19.2809,
    lng: -81.3734,
    volume: 184200000,
    flaggedTxnCount: 238,
    riskLevel: 'CRITICAL',
    dominantTypology: 'Shell Corporation Layering Rings',
    fatfStatus: 'Greylist',
    color: '#ef4444',
  },
  {
    id: 'CH-ZUR',
    name: 'Zurich Financial Center',
    country: 'Switzerland',
    lat: 47.3769,
    lng: 8.5417,
    volume: 142500000,
    flaggedTxnCount: 124,
    riskLevel: 'HIGH',
    dominantTypology: 'Layered Holding & Discretionary Trusts',
    fatfStatus: 'Compliant',
    color: '#f59e0b',
  },
  {
    id: 'GB-LON',
    name: 'City of London Clearing',
    country: 'United Kingdom',
    lat: 51.5074,
    lng: -0.1278,
    volume: 98400000,
    flaggedTxnCount: 156,
    riskLevel: 'MEDIUM',
    dominantTypology: 'Correspondent Commercial Pass-Through',
    fatfStatus: 'Compliant',
    color: '#3b82f6',
  },
  {
    id: 'US-NYC',
    name: 'Wall Street Clearing Gateway',
    country: 'United States',
    lat: 40.7128,
    lng: -74.006,
    volume: 112600000,
    flaggedTxnCount: 182,
    riskLevel: 'HIGH',
    dominantTypology: 'High-Velocity Retail P2P Funneling',
    fatfStatus: 'Compliant',
    color: '#f59e0b',
  },
  {
    id: 'SG-SIN',
    name: 'Singapore Wealth Corridor',
    country: 'Singapore',
    lat: 1.3521,
    lng: 103.8198,
    volume: 86100000,
    flaggedTxnCount: 94,
    riskLevel: 'MEDIUM',
    dominantTypology: 'Digital Asset OTC On/Off-Ramp',
    fatfStatus: 'Compliant',
    color: '#10b981',
  },
  {
    id: 'AE-DXB',
    name: 'Dubai Multi-Commodities Centre',
    country: 'United Arab Emirates',
    lat: 25.2048,
    lng: 55.2708,
    volume: 125800000,
    flaggedTxnCount: 215,
    riskLevel: 'CRITICAL',
    dominantTypology: 'Trade-Based Money Laundering & Bullion Escrow',
    fatfStatus: 'Greylist',
    color: '#ef4444',
  },
  {
    id: 'PA-PAC',
    name: 'Panama City Maritime & Nominee Trust',
    country: 'Panama',
    lat: 8.9824,
    lng: -79.5199,
    volume: 68300000,
    flaggedTxnCount: 118,
    riskLevel: 'CRITICAL',
    dominantTypology: 'Nominee Director Circular Layering',
    fatfStatus: 'Greylist',
    color: '#ef4444',
  },
  {
    id: 'HK-HKG',
    name: 'Hong Kong FX Settlement Hub',
    country: 'Hong Kong SAR',
    lat: 22.3193,
    lng: 114.1694,
    volume: 74900000,
    flaggedTxnCount: 142,
    riskLevel: 'HIGH',
    dominantTypology: 'Underground Banking & Smurfing Dispersion',
    fatfStatus: 'Monitored',
    color: '#8b5cf6',
  },
  {
    id: 'CY-NIC',
    name: 'Nicosia Corporate Services Center',
    country: 'Cyprus',
    lat: 35.1856,
    lng: 33.3823,
    volume: 54200000,
    flaggedTxnCount: 88,
    riskLevel: 'HIGH',
    dominantTypology: 'Eastern European Investment Vehicles',
    fatfStatus: 'Monitored',
    color: '#f59e0b',
  },
  {
    id: 'DE-FRA',
    name: 'Frankfurt Banking District',
    country: 'Germany',
    lat: 50.1109,
    lng: 8.6821,
    volume: 48700000,
    flaggedTxnCount: 62,
    riskLevel: 'MEDIUM',
    dominantTypology: 'Target2 Cross-Border High-Value Wires',
    fatfStatus: 'Compliant',
    color: '#3b82f6',
  },
  {
    id: 'VG-ROA',
    name: 'Road Town BVI Trusts',
    country: 'British Virgin Islands',
    lat: 18.4286,
    lng: -64.6185,
    volume: 91400000,
    flaggedTxnCount: 167,
    riskLevel: 'CRITICAL',
    dominantTypology: 'Bearer Shares & Offshore Holding Shells',
    fatfStatus: 'Greylist',
    color: '#ef4444',
  },
  {
    id: 'JP-TYO',
    name: 'Tokyo Capital Gateway',
    country: 'Japan',
    lat: 35.6762,
    lng: 139.6503,
    volume: 39500000,
    flaggedTxnCount: 45,
    riskLevel: 'MEDIUM',
    dominantTypology: 'Correspondent Commercial Pass-Through',
    fatfStatus: 'Compliant',
    color: '#10b981',
  },
];

const CROSS_BORDER_ARCS: CrossBorderArc[] = [
  {
    id: 'ARC-1',
    fromId: 'KY-GTO',
    toId: 'CH-ZUR',
    volume: 118500000,
    txnCount: 64,
    typology: 'Offshore Shell Layering to Private Bank',
    riskLevel: 'CRITICAL',
    color: '#ef4444', // Red string
  },
  {
    id: 'ARC-2',
    fromId: 'AE-DXB',
    toId: 'SG-SIN',
    volume: 84200000,
    txnCount: 52,
    typology: 'Trade Invoice Overvaluation Route',
    riskLevel: 'CRITICAL',
    color: '#f59e0b', // Amber string
  },
  {
    id: 'ARC-3',
    fromId: 'GB-LON',
    toId: 'KY-GTO',
    volume: 65100000,
    txnCount: 41,
    typology: 'Structured Capital Flight Corridor',
    riskLevel: 'HIGH',
    color: '#06b6d4', // Cyan string
  },
  {
    id: 'ARC-4',
    fromId: 'PA-PAC',
    toId: 'US-NYC',
    volume: 48900000,
    txnCount: 33,
    typology: 'Real Estate & Private Equity Masking',
    riskLevel: 'CRITICAL',
    color: '#ef4444', // Red string
  },
  {
    id: 'ARC-5',
    fromId: 'HK-HKG',
    toId: 'CH-ZUR',
    volume: 52400000,
    txnCount: 39,
    typology: 'Asian Smurfing Settlement Flow',
    riskLevel: 'HIGH',
    color: '#a855f7', // Violet string
  },
  {
    id: 'ARC-6',
    fromId: 'CY-NIC',
    toId: 'GB-LON',
    volume: 38200000,
    txnCount: 27,
    typology: 'Escrow Account Intermediary Routing',
    riskLevel: 'MEDIUM',
    color: '#3b82f6', // Blue string
  },
  {
    id: 'ARC-7',
    fromId: 'AE-DXB',
    toId: 'CY-NIC',
    volume: 41600000,
    txnCount: 30,
    typology: 'Cross-Border Bullion Settlement',
    riskLevel: 'HIGH',
    color: '#f59e0b', // Amber string
  },
  {
    id: 'ARC-8',
    fromId: 'VG-ROA',
    toId: 'US-NYC',
    volume: 72800000,
    txnCount: 48,
    typology: 'Caribbean Nominee Dispersal Corridor',
    riskLevel: 'CRITICAL',
    color: '#ef4444', // Red string
  },
  {
    id: 'ARC-9',
    fromId: 'SG-SIN',
    toId: 'HK-HKG',
    volume: 49500000,
    txnCount: 35,
    typology: 'Dual-Hub OTC Crypto Clearing Channel',
    riskLevel: 'MEDIUM',
    color: '#10b981', // Emerald string
  },
  {
    id: 'ARC-10',
    fromId: 'CH-ZUR',
    toId: 'DE-FRA',
    volume: 32600000,
    txnCount: 22,
    typology: 'SEPA Interbank Layering Transit',
    riskLevel: 'MEDIUM',
    color: '#06b6d4', // Cyan string
  },
  {
    id: 'ARC-11',
    fromId: 'PA-PAC',
    toId: 'KY-GTO',
    volume: 44300000,
    txnCount: 29,
    typology: 'Offshore Jurisdiction Re-Invoicing',
    riskLevel: 'CRITICAL',
    color: '#ef4444', // Red string
  },
  {
    id: 'ARC-12',
    fromId: 'JP-TYO',
    toId: 'SG-SIN',
    volume: 28400000,
    txnCount: 19,
    typology: 'Cross-Strait Commercial Remittance',
    riskLevel: 'MEDIUM',
    color: '#10b981', // Emerald string
  },
];

/**
 * Accurately translates Latitude and Longitude to 3D Cartesian coordinates (X, Y, Z)
 * precisely matching Three.js SphereGeometry UV mapping on an equirectangular Earth map.
 */
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export default function GeospatialIntelligence() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedHub, setSelectedHub] = useState<JurisdictionHub>(GLOBAL_HUBS[0]); // Cayman Islands
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [timeRange, setTimeRange] = useState<string>('30D');
  const [hoveredHub, setHoveredHub] = useState<JurisdictionHub | null>(null);

  // Rotation targeting ref for smooth camera fly-to on hub click
  const targetRotationRef = useRef<{ x: number; y: number } | null>(null);

  const filteredArcs = useMemo(() => {
    if (riskFilter === 'ALL') return CROSS_BORDER_ARCS;
    return CROSS_BORDER_ARCS.filter((a) => a.riskLevel === riskFilter);
  }, [riskFilter]);

  // Rotate globe to center on a specific hub
  const focusHub = (hub: JurisdictionHub) => {
    setSelectedHub(hub);
    // Calculate target rotation angles so the hub faces directly toward camera (+Z)
    const targetY = -((hub.lng + 90) * (Math.PI / 180));
    const targetX = (hub.lat * (Math.PI / 180)) * 0.5;
    targetRotationRef.current = { x: targetX, y: targetY };
  };

  // Three.js interactive 3D Globe with photorealistic Earth & 3D Flight Strings
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 700;
    let height = container.clientHeight || 540;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();

    // High quality perspective camera centered at (0, 0, 155) looking at (0, 0, 0)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 155);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Cosmic Background: Starfield with 500 twinkling stars
    const starGeo = new THREE.BufferGeometry();
    const starCount = 500;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 800;
      starPositions[i + 1] = (Math.random() - 0.5) * 800;
      starPositions[i + 2] = -150 - Math.random() * 400;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 1.2,
      transparent: true,
      opacity: 0.7,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 3. Globe Root Group (Holds Earth, pins, rings, and connecting strings)
    const globeRadius = 55;
    const globeGroup = new THREE.Group();
    // Default pleasant tilt for realistic Earth axial tilt (23.5 degrees)
    globeGroup.rotation.x = 0.22;
    globeGroup.rotation.y = -1.2;
    scene.add(globeGroup);

    // 4. Photorealistic Earth Texture Surface
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load(
      '/textures/earth-blue-marble.jpg',
      () => {
        renderer.render(scene, camera);
      }
    );
    earthTexture.colorSpace = THREE.SRGBColorSpace;

    const earthGeo = new THREE.SphereGeometry(globeRadius, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.65,
      metalness: 0.1,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);

    // Atmospheric Glow Halo Mesh (Creates realistic luminous blue rim around Earth)
    const atmosGeo = new THREE.SphereGeometry(globeRadius * 1.018, 64, 64);
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.2);
          gl_FragColor = vec4(0.24, 0.55, 1.0, 1.0) * intensity * 0.9;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosMesh);

    // Subtle Coordinates Grid Mesh
    const gridMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.12,
    });
    for (let lat = -60; lat <= 60; lat += 30) {
      const ringRadius = globeRadius * Math.cos((lat * Math.PI) / 180);
      const ringY = globeRadius * Math.sin((lat * Math.PI) / 180);
      const ringGeo = new THREE.RingGeometry(ringRadius - 0.08, ringRadius, 64);
      const ringMesh = new THREE.Mesh(ringGeo, gridMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = ringY;
      globeGroup.add(ringMesh);
    }

    // 5. Realistic Planetary Lighting
    const ambientLight = new THREE.AmbientLight(0xe0f2fe, 0.75);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.6);
    sunLight.position.set(160, 60, 140);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.65);
    rimLight.position.set(-140, -40, -100);
    scene.add(rimLight);

    // 6. Hub Beacons & Pulsing Geographic Rings
    const hubObjects: { mesh: THREE.Mesh; hub: JurisdictionHub }[] = [];
    const pulseRings: { mesh: THREE.Mesh; phase: number; baseScale: number }[] = [];

    GLOBAL_HUBS.forEach((hub, idx) => {
      const pos = latLngToVector3(hub.lat, hub.lng, globeRadius);
      const hexColor = new THREE.Color(hub.color);

      // Core Hub Beacon Dot (elevated 0.6 above sphere surface)
      const markerGeo = new THREE.SphereGeometry(1.4, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({ color: hexColor });
      const markerMesh = new THREE.Mesh(markerGeo, markerMat);
      markerMesh.position.copy(pos.clone().multiplyScalar(1.008));
      globeGroup.add(markerMesh);
      hubObjects.push({ mesh: markerMesh, hub });

      // Ground Pulsing Ring Flat to Surface
      const ringGeo = new THREE.RingGeometry(1.8, 2.5, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: hexColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos.clone().multiplyScalar(1.012));
      ringMesh.lookAt(pos.clone().multiplyScalar(2));
      globeGroup.add(ringMesh);

      pulseRings.push({
        mesh: ringMesh,
        phase: (idx * Math.PI) / 4,
        baseScale: 1,
      });
    });

    // 7. Vibrant 3D Arcs / Strings Connecting Global Regions
    interface ActiveArc {
      tube: THREE.Mesh;
      photons: { mesh: THREE.Mesh; t: number; speed: number }[];
      curve: THREE.CubicBezierCurve3;
    }
    const renderedArcs: ActiveArc[] = [];

    filteredArcs.forEach((arc) => {
      const fromHub = GLOBAL_HUBS.find((h) => h.id === arc.fromId);
      const toHub = GLOBAL_HUBS.find((h) => h.id === arc.toId);
      if (!fromHub || !toHub) return;

      const p1 = latLngToVector3(fromHub.lat, fromHub.lng, globeRadius);
      const p2 = latLngToVector3(toHub.lat, toHub.lng, globeRadius);

      const distance = p1.distanceTo(p2);
      // Elevation scales naturally with flight distance across continents
      const maxAltitude = globeRadius + Math.min(distance * 0.38, 38);

      // 3D Cubic Bezier curve for elegant high-altitude flight trajectories
      const mid1 = p1.clone().lerp(p2, 0.33);
      mid1.setLength(maxAltitude);
      const mid2 = p1.clone().lerp(p2, 0.67);
      mid2.setLength(maxAltitude);

      const curve = new THREE.CubicBezierCurve3(p1, mid1, mid2, p2);

      // Render arc as physical glowing 3D fiber tube
      const tubeGeo = new THREE.TubeGeometry(curve, 50, 0.38, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(arc.color),
        transparent: true,
        opacity: 0.72,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      globeGroup.add(tubeMesh);

      // 2 Traveling light photons along this string
      const photons: { mesh: THREE.Mesh; t: number; speed: number }[] = [];
      for (let i = 0; i < 2; i++) {
        const photonGeo = new THREE.SphereGeometry(1.0, 12, 12);
        const photonMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const photonMesh = new THREE.Mesh(photonGeo, photonMat);
        globeGroup.add(photonMesh);
        photons.push({
          mesh: photonMesh,
          t: (i * 0.5 + Math.random() * 0.2) % 1,
          speed: 0.004 + Math.random() * 0.003,
        });
      }

      renderedArcs.push({
        tube: tubeMesh,
        photons,
        curve,
      });
    });

    // 8. Drag to Orbit & Raycaster Click Handling
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      targetRotationRef.current = null; // Cancel automated fly-to on manual drag
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Handle dragging rotation
      if (isDragging) {
        const deltaX = e.clientX - prevMouse.x;
        const deltaY = e.clientY - prevMouse.y;

        globeGroup.rotation.y += deltaX * 0.005;
        globeGroup.rotation.x = Math.max(
          -Math.PI / 2.3,
          Math.min(Math.PI / 2.3, globeGroup.rotation.x + deltaY * 0.005)
        );

        prevMouse = { x: e.clientX, y: e.clientY };
      }

      // Hover detection on hub markers
      raycaster.setFromCamera(mouse, camera);
      const meshes = hubObjects.map((h) => h.mesh);
      const intersects = raycaster.intersectObjects(meshes);
      if (intersects.length > 0) {
        const hit = hubObjects.find((h) => h.mesh === intersects[0].object);
        if (hit) {
          setHoveredHub(hit.hub);
          renderer.domElement.style.cursor = 'pointer';
        }
      } else {
        setHoveredHub(null);
        renderer.domElement.style.cursor = isDragging ? 'grabbing' : 'grab';
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = hubObjects.map((h) => h.mesh);
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hit = hubObjects.find((h) => h.mesh === intersects[0].object);
        if (hit) {
          focusHub(hit.hub);
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('click', onClick);

    // 9. Continuous Animation Loop
    let animationId: number;
    let clockTime = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      clockTime += 0.03;

      // Auto-rotation around vertical axis when user is not manually dragging or flying
      if (autoRotate && !isDragging && !targetRotationRef.current) {
        globeGroup.rotation.y += 0.0018;
      }

      // Smooth camera interpolation toward target rotation when a hub is clicked
      if (targetRotationRef.current) {
        const target = targetRotationRef.current;
        // Normalize rotation angles for shortest arc interpolation
        let dy = target.y - globeGroup.rotation.y;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;

        globeGroup.rotation.y += dy * 0.06;
        globeGroup.rotation.x += (target.x - globeGroup.rotation.x) * 0.06;

        if (Math.abs(dy) < 0.01 && Math.abs(target.x - globeGroup.rotation.x) < 0.01) {
          targetRotationRef.current = null;
        }
      }

      // Animate pulsing beacon rings at geographic locations
      pulseRings.forEach((p) => {
        const scale = 1 + 0.45 * Math.sin(clockTime * 2 + p.phase);
        p.mesh.scale.set(scale, scale, 1);
        (p.mesh.material as THREE.MeshBasicMaterial).opacity =
          0.3 + 0.5 * Math.cos(clockTime * 2 + p.phase);
      });

      // Animate traveling photons across curved strings
      renderedArcs.forEach((arc) => {
        arc.photons.forEach((photon) => {
          photon.t += photon.speed;
          if (photon.t > 1) photon.t = 0;
          const pos = arc.curve.getPoint(photon.t);
          photon.mesh.position.copy(pos);
        });
      });

      renderer.render(scene, camera);
    };

    animate();

    // 10. Robust Container Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });

    resizeObserver.observe(container);

    // Cleanup on unmount or filter re-render
    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('click', onClick);
      renderer.dispose();
    };
  }, [autoRotate, filteredArcs]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8 text-slate-800">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <GlobeIcon className="w-6 h-6 text-blue-600" />
            Geospatial Intelligence & Cross-Border Flight Heatmap
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Photorealistic 3D Earth tracking of cross-border capital flight, offshore layering, and multi-jurisdiction risk strings
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            {['7D', '30D', '90D', 'ALL'].map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  timeRange === r
                    ? 'bg-blue-600 !text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              autoRotate
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            {autoRotate ? 'Spinning ON' : 'Paused'}
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Total Cross-Border Flight</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">$842,500,000</div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +14.2% from prior period
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Active High-Risk Corridors</span>
            <ShieldAlert className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-xl font-bold font-mono text-red-600">{filteredArcs.length} Corridors</div>
          <span className="text-[10px] text-red-600 font-semibold mt-1 block">
            4 Flagged FATF Greylist Destinations
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Offshore Haven Inflows</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-700">$378,300,000</div>
          <span className="text-[10px] text-slate-400 mt-1 block">44.9% of total flight volume</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Transit Velocity</span>
            <Activity className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-600">2.6 Hours</div>
          <span className="text-[10px] text-amber-600 font-semibold mt-1 block">
            Rapid multi-hop routing detected
          </span>
        </div>
      </div>

      {/* Main Grid: 3D WebGL Earth Canvas (Left) + Jurisdiction Dossier & Corridor List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3D Interactive Three.js Earth Card */}
        <div className="lg:col-span-8 flex flex-col p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          {/* Globe Header Bar */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-blue-600" />
                Global Transaction Network Mesh
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Drag to rotate • Click hubs to inspect & orbit
              </span>
            </div>

            {/* Corridor Risk Filter */}
            <div className="flex items-center gap-2">
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value="ALL">All Flight Strings ({CROSS_BORDER_ARCS.length})</option>
                <option value="CRITICAL">Critical Havens (Red)</option>
                <option value="HIGH">High-Risk Gateways (Amber)</option>
                <option value="MEDIUM">Commercial / OTC (Cyan & Green)</option>
              </select>
            </div>
          </div>

          {/* Quick Region Focus Pills */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Fly To:
            </span>
            {[
              GLOBAL_HUBS[0], // Cayman
              GLOBAL_HUBS[1], // Zurich
              GLOBAL_HUBS[2], // London
              GLOBAL_HUBS[3], // NYC
              GLOBAL_HUBS[4], // Singapore
              GLOBAL_HUBS[5], // Dubai
              GLOBAL_HUBS[6], // Panama
            ].map((hub) => (
              <button
                key={hub.id}
                onClick={() => focusHub(hub)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                  selectedHub.id === hub.id
                    ? 'bg-blue-600 !text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: selectedHub.id === hub.id ? '#ffffff' : hub.color }}
                />
                {hub.country.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* WebGL Canvas Container: Deep navy space viewport where Earth & strings glow */}
          <div className="relative w-full h-[520px] rounded-xl overflow-hidden bg-slate-950 shadow-inner border border-slate-900">
            <div
              ref={mountRef}
              className="w-full h-full cursor-grab active:cursor-grabbing"
            />

            {/* Hover Tooltip Overlay */}
            {hoveredHub && (
              <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md text-white p-2.5 rounded-xl border border-slate-700 text-xs shadow-lg pointer-events-none transition-all">
                <div className="font-bold flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: hoveredHub.color }}
                  />
                  {hoveredHub.name}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{hoveredHub.country}</div>
                <div className="text-[11px] font-mono text-emerald-400 font-semibold mt-1">
                  Vol: {formatCurrency(hoveredHub.volume)} • {hoveredHub.flaggedTxnCount} txns
                </div>
              </div>
            )}

            {/* Earth Orientation Indicator */}
            <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-xs text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-mono flex items-center gap-1.5 pointer-events-none">
              <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
              Blue Marble Satellite 3D • 60 FPS
            </div>
          </div>

          {/* Interactive Legend for Connecting Strings */}
          <div className="pt-3 mt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-600 gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-xs" /> Critical Offshore Shells
              </span>
              <span className="flex items-center gap-1 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" /> Trade-Based AML / Bullion
              </span>
              <span className="flex items-center gap-1 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-xs" /> Commercial Clearing Pass
              </span>
              <span className="flex items-center gap-1 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-xs" /> Asian Smurfing / Hawala
              </span>
              <span className="flex items-center gap-1 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" /> Institutional OTC
              </span>
            </div>
            <span className="font-mono text-slate-400 text-[10px]">WebGL Hardware Accelerated</span>
          </div>
        </div>

        {/* Right Column: Selected Hub Dossier & Top Flight Corridors */}
        <div className="lg:col-span-4 space-y-4">
          {/* Selected Jurisdiction Dossier */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" /> Jurisdiction Dossier
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  selectedHub.riskLevel === 'CRITICAL'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : selectedHub.riskLevel === 'HIGH'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {selectedHub.riskLevel} RISK
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900">{selectedHub.name}</h3>
            <p className="text-xs text-slate-500 mb-3">{selectedHub.country}</p>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-medium">Flagged Volume</span>
                <span className="font-mono font-bold text-slate-900 text-xs">
                  {formatCurrency(selectedHub.volume)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-medium">Flagged Txns</span>
                <span className="font-mono font-bold text-red-600 text-xs">
                  {selectedHub.flaggedTxnCount} Txns
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 mb-3 text-xs">
              <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                Primary AML Typology
              </span>
              <p className="text-slate-800 font-medium">{selectedHub.dominantTypology}</p>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
              <span className="text-slate-500">FATF Compliance:</span>
              <span
                className={`font-semibold ${
                  selectedHub.fatfStatus === 'Greylist'
                    ? 'text-red-600'
                    : selectedHub.fatfStatus === 'Monitored'
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {selectedHub.fatfStatus}
              </span>
            </div>

            <button
              onClick={() => focusHub(selectedHub)}
              className="w-full mt-3 py-1.5 px-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Target className="w-3.5 h-3.5" />
              Center 3D Earth on this Hub
            </button>
          </div>

          {/* Quick Hub Selector list */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              Major Offshore Corridors
            </h4>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 text-xs">
              {GLOBAL_HUBS.map((hub) => (
                <div
                  key={hub.id}
                  onClick={() => focusHub(hub)}
                  className={`p-2 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    selectedHub.id === hub.id
                      ? 'bg-blue-50/70 border-blue-300 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: hub.color }}
                      />
                      {hub.name}
                    </div>
                    <div className="text-[10px] text-slate-500">{hub.country}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-slate-800 block text-xs">
                      {formatCurrency(hub.volume)}
                    </span>
                    <span
                      className={`text-[9px] font-bold ${
                        hub.riskLevel === 'CRITICAL'
                          ? 'text-red-600'
                          : hub.riskLevel === 'HIGH'
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {hub.riskLevel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Border Flight Corridors Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Cross-Border Capital Flight Flow Matrix
          </h3>
          <span className="text-xs font-mono text-slate-500 font-medium">
            {filteredArcs.length} active international laundering routes
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-3 font-semibold">Origin Hub</th>
              <th className="pb-3 font-semibold">Destination Hub</th>
              <th className="pb-3 font-semibold">Transfer Typology</th>
              <th className="pb-3 font-semibold">Total Volume</th>
              <th className="pb-3 font-semibold">Velocity</th>
              <th className="pb-3 font-semibold text-right">Risk Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredArcs.map((arc) => {
              const from = GLOBAL_HUBS.find((h) => h.id === arc.fromId);
              const to = GLOBAL_HUBS.find((h) => h.id === arc.toId);
              return (
                <tr
                  key={arc.id}
                  onClick={() => from && focusHub(from)}
                  className="hover:bg-slate-50 transition cursor-pointer"
                >
                  <td className="py-3 font-semibold text-slate-900">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: arc.color }}
                      />
                      {from?.name}{' '}
                      <span className="text-slate-400 font-normal">({from?.country})</span>
                    </span>
                  </td>
                  <td className="py-3 font-semibold text-slate-900">
                    <span className="flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      {to?.name} <span className="text-slate-400 font-normal">({to?.country})</span>
                    </span>
                  </td>
                  <td className="py-3 text-slate-700">{arc.typology}</td>
                  <td className="py-3 font-mono font-bold text-slate-900">
                    {formatCurrency(arc.volume)}
                  </td>
                  <td className="py-3 font-mono text-slate-500">{arc.txnCount} wires / 24h</td>
                  <td className="py-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        arc.riskLevel === 'CRITICAL'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : arc.riskLevel === 'HIGH'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {arc.riskLevel}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
