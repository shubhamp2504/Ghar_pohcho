import type { HighwayWaypoint, WaypointStatus } from '../../types/waypoints';
import type { RouteOption, LocationPoint, TrafficSegment } from '../../types/routing';
import { calculateHaversineDistance } from '../../utils/geo';

interface MilestoneSpec {
  id: string;
  name: string;
  localName?: { hi: string; mr: string };
  distanceKm: number;
  lat: number;
  lng: number;
  defaultHighlight?: string;
  isOrigin?: boolean;
  isDestination?: boolean;
}

export class IntermediateTownsService {
  /**
   * Generates step-by-step intermediate towns guide.
   * Milestone traffic statuses are DYNAMICALLY resolved against real live sensor traffic segments.
   */
  getWaypointsForRoute(
    route: RouteOption,
    origin: LocationPoint,
    destination: LocationPoint
  ): HighwayWaypoint[] {
    const originClean = origin.name.toLowerCase();
    const destClean = destination.name.toLowerCase();
    const totalDistKm = Math.round(route.distanceMeters / 1000);
    const totalDurationSec = route.durationSeconds;
    const now = new Date();

    const calcEta = (fraction: number): string => {
      const etaTime = new Date(now.getTime() + totalDurationSec * fraction * 1000);
      return etaTime.toISOString();
    };

    let specs: MilestoneSpec[] = [];

    // Helper checks
    const isMumb = (s: string) => s.includes('mumbai') || s.includes('chembur') || s.includes('thane') || s.includes('navi') || s.includes('bandra') || s.includes('dadar') || s.includes('andheri') || s.includes('sewri');
    const isPune = (s: string) => s.includes('pune') || s.includes('pcmc') || s.includes('kothrud') || s.includes('shivajinagar') || s.includes('hadapsar') || s.includes('hinjawadi') || s.includes('swargate');
    const isNagpur = (s: string) => s.includes('nagpur') || s.includes('butibori') || s.includes('sitabuldi');
    const isNashik = (s: string) => s.includes('nashik') || s.includes('panchavati') || s.includes('dwarka') || s.includes('trimbak');
    const isKolhapur = (s: string) => s.includes('kolhapur') || s.includes('shiroli') || s.includes('ichalkaranji');
    const isMahabaleshwar = (s: string) => s.includes('mahabaleshwar') || s.includes('panchgani') || s.includes('mapro');
    const isAlibaug = (s: string) => s.includes('alibaug') || s.includes('varsoli') || s.includes('nagaon') || s.includes('mandwa');
    const isGoa = (s: string) => s.includes('goa') || s.includes('sawantwadi') || s.includes('malvan') || s.includes('tarkarli') || s.includes('chiplun') || s.includes('panaji');
    const isShirdi = (s: string) => s.includes('shirdi') || s.includes('saibaba');
    const isPandharpur = (s: string) => s.includes('pandharpur') || s.includes('vitthal');
    const isSambhajinagar = (s: string) => s.includes('sambhajinagar') || s.includes('aurangabad') || s.includes('grishneshwar') || s.includes('ellora');
    const isAmravati = (s: string) => s.includes('amravati');

    // 1. Mumbai <-> Pune Corridor (Expressway NE 1)
    if (
      (isMumb(originClean) && isPune(destClean)) ||
      (isPune(originClean) && isMumb(destClean))
    ) {
      specs = [
        {
          id: 'wp_mp_0',
          name: origin.name.split(',')[0],
          localName: { hi: 'मुंबई (शुरुआत)', mr: 'मुंबई (सुरुवात)' },
          distanceKm: 0,
          lat: origin.lat,
          lng: origin.lng,
          defaultHighlight: 'Start of Expressway Corridor',
          isOrigin: true,
        },
        {
          id: 'wp_mp_1',
          name: 'Vashi Creek & Navi Mumbai',
          localName: { hi: 'वाशी क्रीक ब्रिज', mr: 'वाशी खाडी पूल' },
          distanceKm: 22,
          lat: 19.065,
          lng: 72.998,
          defaultHighlight: 'Sion-Panvel Expressway Stretch',
        },
        {
          id: 'wp_mp_2',
          name: 'Panvel / Kalamboli Junction',
          localName: { hi: 'पनवेल जंक्शन', mr: 'पनवेल जंक्शन' },
          distanceKm: 38,
          lat: 18.995,
          lng: 73.118,
          defaultHighlight: 'Expressway Zero-Mile Start',
        },
        {
          id: 'wp_mp_3',
          name: 'Khalapur Toll & Food Plaza',
          localName: { hi: 'खालापूर टोल व फूड मॉल', mr: 'खालापूर टोल व फूड मॉल' },
          distanceKm: 54,
          lat: 18.8175,
          lng: 73.284,
          defaultHighlight: 'Fastag Toll Plaza • McDonald’s / Starbucks',
        },
        {
          id: 'wp_mp_4',
          name: 'Khandala & Lonavala Ghat',
          localName: { hi: 'खंडाला व लोनावला घाट', mr: 'खंडाळा व लोणावळा घाट' },
          distanceKm: 74,
          lat: 18.756,
          lng: 73.407,
          defaultHighlight: 'Scenic Mountain Pass • Keep in Lower Gear',
        },
        {
          id: 'wp_mp_5',
          name: 'Urse Food Mall & Talegaon Toll',
          localName: { hi: 'उर्से फूड मॉल व टोल', mr: 'उर्से फूड मॉल व टोल' },
          distanceKm: 98,
          lat: 18.735,
          lng: 73.658,
          defaultHighlight: 'Final Expressway Toll • Fuel & EV Hub',
        },
        {
          id: 'wp_mp_6',
          name: 'Dehu Road & PCMC Entry',
          localName: { hi: 'देहू रोड / पिंपरी', mr: 'देहू रोड / पिंपरी' },
          distanceKm: 124,
          lat: 18.665,
          lng: 73.745,
          defaultHighlight: 'Pune Outer Bypass Entry',
        },
        {
          id: 'wp_mp_7',
          name: destination.name.split(',')[0],
          localName: { hi: 'पुणे (पहुंच)', mr: 'पुणे (आगमन)' },
          distanceKm: totalDistKm,
          lat: destination.lat,
          lng: destination.lng,
          defaultHighlight: 'Destination Arrival',
          isDestination: true,
        },
      ];
    }

    // 2. Mumbai <-> Nagpur Corridor (Samruddhi Mahamarg - 701 km Super Expressway)
    else if (
      (isMumb(originClean) && isNagpur(destClean)) ||
      (isNagpur(originClean) && isMumb(destClean))
    ) {
      specs = [
        {
          id: 'wp_mn_0',
          name: origin.name.split(',')[0],
          localName: { hi: 'मुंबई MMR', mr: 'मुंबई MMR' },
          distanceKm: 0,
          lat: origin.lat,
          lng: origin.lng,
          defaultHighlight: 'Start of Samruddhi Mahamarg Corridor',
          isOrigin: true,
        },
        {
          id: 'wp_mn_1',
          name: 'Padgha & Bhiwandi Exit',
          localName: { hi: 'पडघा व भिवंडी', mr: 'पडघा व भिवंडी एक्झिट' },
          distanceKm: 38,
          lat: 19.3444,
          lng: 73.1539,
          defaultHighlight: 'Expressway Western Approach',
        },
        {
          id: 'wp_mn_2',
          name: 'Kasara Ghat & Igatpuri Tunnel',
          localName: { hi: 'कसारा घाट व इगतपुरी', mr: 'कसारा घाट व इगतपुरी बोगदा' },
          distanceKm: 120,
          lat: 19.6967,
          lng: 73.5614,
          defaultHighlight: 'Sahyadri Tunnel & Scenic Mist Stretch',
        },
        {
          id: 'wp_mn_3',
          name: 'Sinnar Interchange (Nashik Cut)',
          localName: { hi: 'सिन्नर इंटरचेंज', mr: 'सिन्नर इंटरचेंज' },
          distanceKm: 180,
          lat: 19.8456,
          lng: 74.0049,
          defaultHighlight: 'Wayside Amenity Hub • Fuel & Washrooms',
        },
        {
          id: 'wp_mn_4',
          name: 'Shirdi Interchange (Kopargaon Cut)',
          localName: { hi: 'शिर्डी इंटरचेंज', mr: 'शिर्डी इंटरचेंज' },
          distanceKm: 235,
          lat: 19.8142,
          lng: 74.4983,
          defaultHighlight: 'Direct Temple Cut • EV DC Fast Chargers',
        },
        {
          id: 'wp_mn_5',
          name: 'Chhatrapati Sambhajinagar Interchange',
          localName: { hi: 'छ. संभाजीनगर इंटरचेंज', mr: 'छ. संभाजीनगर इंटरचेंज' },
          distanceKm: 340,
          lat: 19.8912,
          lng: 75.2981,
          defaultHighlight: 'Marathwada Central Interchange',
        },
        {
          id: 'wp_mn_6',
          name: 'Jalna Steel City Interchange',
          localName: { hi: 'जालना इंटरचेंज', mr: 'जालना इंटरचेंज' },
          distanceKm: 405,
          lat: 19.8654,
          lng: 75.9122,
          defaultHighlight: 'Halfway Crossing • Fuel & Food Oasis',
        },
        {
          id: 'wp_mn_7',
          name: 'Mehkar & Sindkhed Raja',
          localName: { hi: 'मेहकर व सिंदखेड राजा', mr: 'मेहकर व सिंदखेड राजा' },
          distanceKm: 485,
          lat: 20.1539,
          lng: 76.5742,
          defaultHighlight: 'Buldhana District Stretch',
        },
        {
          id: 'wp_mn_8',
          name: 'Karanja Lad Interchange',
          localName: { hi: 'कारंजा लाड इंटरचेंज', mr: 'कारंजा लाड इंटरचेंज' },
          distanceKm: 565,
          lat: 20.4833,
          lng: 77.4833,
          defaultHighlight: 'Washim-Amravati Regional Connection',
        },
        {
          id: 'wp_mn_9',
          name: 'Seloo & Wardha Interchange',
          localName: { hi: 'वर्धा इंटरचेंज', mr: 'वर्धा इंटरचेंज' },
          distanceKm: 640,
          lat: 20.8122,
          lng: 78.7155,
          defaultHighlight: 'Wardha Valley Expressway Approach',
        },
        {
          id: 'wp_mn_10',
          name: destination.name.split(',')[0],
          localName: { hi: 'नागपुर जीरो माइल', mr: 'नागपूर झिरो माईल' },
          distanceKm: totalDistKm,
          lat: destination.lat,
          lng: destination.lng,
          defaultHighlight: 'Orange City Arrival',
          isDestination: true,
        },
      ];
    }

    // 3. Mumbai <-> Nashik (NH 160 via Kasara Ghat)
    else if (
      (isMumb(originClean) && isNashik(destClean)) ||
      (isNashik(originClean) && isMumb(destClean))
    ) {
      specs = [
        {
          id: 'wp_mna_0',
          name: origin.name.split(',')[0],
          localName: { hi: 'मुंबई / ठाणे', mr: 'मुंबई / ठाणे' },
          distanceKm: 0,
          lat: origin.lat,
          lng: origin.lng,
          defaultHighlight: 'Journey Origin',
          isOrigin: true,
        },
        {
          id: 'wp_mna_1',
          name: 'Bhiwandi Bypass & Padgha Toll',
          localName: { hi: 'भिवंडी बायपास व टोल', mr: 'भिवंडी बायपास व पडघा टोल' },
          distanceKm: 32,
          lat: 19.3444,
          lng: 73.1539,
          defaultHighlight: 'Fastag Toll Plaza',
        },
        {
          id: 'wp_mna_2',
          name: 'Asangaon & Vasind Food Hub',
          localName: { hi: 'आसनगांव फूड हब', mr: 'आसनगाव फूड हब' },
          distanceKm: 58,
          lat: 19.4389,
          lng: 73.3086,
          defaultHighlight: 'Popular Breakfast & Highway Dhabas',
        },
        {
          id: 'wp_mna_3',
          name: 'Kasara Ghat Ascent',
          localName: { hi: 'कसारा घाट चढ़ाई', mr: 'कसारा घाट चढाई' },
          distanceKm: 95,
          lat: 19.6542,
          lng: 73.4981,
          defaultHighlight: 'Steep Sahyadri Curves • Keep in Low Gear',
        },
        {
          id: 'wp_mna_4',
          name: 'Igatpuri Fog Zone & Toll',
          localName: { hi: 'इगतपुरी व टोल प्लाजा', mr: 'इगतपुरी व टोल नाका' },
          distanceKm: 118,
          lat: 19.6967,
          lng: 73.5614,
          defaultHighlight: 'Cool Climate • Manas Resort Rest Area',
        },
        {
          id: 'wp_mna_5',
          name: 'Gonde MIDC & Wadiware',
          localName: { hi: 'गोंदे एमआयडीसी', mr: 'गोंदे एमआयडीसी' },
          distanceKm: 145,
          lat: 19.8654,
          lng: 73.6894,
          defaultHighlight: 'Nashik Outer Highway Stretch',
        },
        {
          id: 'wp_mna_6',
          name: destination.name.split(',')[0],
          localName: { hi: 'नासिक (द्वारका / पंचवटी)', mr: 'नाशिक (द्वारका / पंचवटी)' },
          distanceKm: totalDistKm,
          lat: destination.lat,
          lng: destination.lng,
          defaultHighlight: 'Nashik Grape City Arrival',
          isDestination: true,
        },
      ];
    }

    // 4. Pune <-> Mahabaleshwar / Panchgani (via Wai & Pasarni Ghat)
    else if (
      (isPune(originClean) && isMahabaleshwar(destClean)) ||
      (isMahabaleshwar(originClean) && isPune(destClean))
    ) {
      specs = [
        {
          id: 'wp_pm_0',
          name: origin.name.split(',')[0],
          localName: { hi: 'पुणे (शुरुआत)', mr: 'पुणे (सुरुवात)' },
          distanceKm: 0,
          lat: origin.lat,
          lng: origin.lng,
          defaultHighlight: 'Journey Origin',
          isOrigin: true,
        },
        {
          id: 'wp_pm_1',
          name: 'Khed Shivapur Toll Plaza',
          localName: { hi: 'खेड शिवापूर टोल नाका', mr: 'खेड शिवापूर टोल नाका' },
          distanceKm: 25,
          lat: 18.3489,
          lng: 73.8742,
          defaultHighlight: 'NH 48 Fastag Toll • High Peak Hours Traffic',
        },
        {
          id: 'wp_pm_2',
          name: 'Shirwal Industrial Corridor',
          localName: { hi: 'शिरवळ एमआयडीसी', mr: 'शिरवळ एमआयडीसी' },
          distanceKm: 52,
          lat: 18.1345,
          lng: 73.9877,
          defaultHighlight: 'Highway Food Court & Fuel Stations',
        },
        {
          id: 'wp_pm_3',
          name: 'Khambatki Ghat & Surur Junction',
          localName: { hi: 'खंबाटकी घाट व सुरुर', mr: 'खंबाटकी घाट व सुरुर फाटा' },
          distanceKm: 78,
          lat: 18.0125,
          lng: 74.0214,
          defaultHighlight: 'Exit NH 48 toward Wai • Mapro Food Lounge',
        },
        {
          id: 'wp_pm_4',
          name: 'Wai (Ganpati Mandir Ghat)',
          localName: { hi: 'वाई गणपती घाट', mr: 'वाई गणपती घाट' },
          distanceKm: 92,
          lat: 17.9482,
          lng: 73.8920,
          defaultHighlight: 'Historical Krishna River Town',
        },
        {
          id: 'wp_pm_5',
          name: 'Pasarni Ghat (Hairpin Turns)',
          localName: { hi: 'पसरणी घाट', mr: 'पसरणी घाट वळणे' },
          distanceKm: 104,
          lat: 17.9356,
          lng: 73.8412,
          defaultHighlight: 'Scenic Mountain Ascent • Drive Carefully',
        },
        {
          id: 'wp_pm_6',
          name: 'Panchgani (Table Land)',
          localName: { hi: 'पाचगणी', mr: 'पाचगणी पठार' },
          distanceKm: 108,
          lat: 17.9256,
          lng: 73.8017,
          defaultHighlight: 'Cool Plateau Breeze & Strawberry Fields',
        },
        {
          id: 'wp_pm_7',
          name: destination.name.split(',')[0],
          localName: { hi: 'महाबलेश्वर (वेण्णा लेक)', mr: 'महाबळेश्वर (वेण्णा तलाव)' },
          distanceKm: totalDistKm,
          lat: destination.lat,
          lng: destination.lng,
          defaultHighlight: 'Hill Station Arrival',
          isDestination: true,
        },
      ];
    }

    // 5. Pune <-> Kolhapur (NH 48 Western Maharashtra Corridor)
    else if (
      (isPune(originClean) && isKolhapur(destClean)) ||
      (isKolhapur(originClean) && isPune(destClean))
    ) {
      specs = [
        {
          id: 'wp_pk_0',
          name: origin.name.split(',')[0],
          localName: { hi: 'पुणे (स्वारगेट / कात्रज)', mr: 'पुणे (स्वारगेट / कात्रज)' },
          distanceKm: 0,
          lat: origin.lat,
          lng: origin.lng,
          defaultHighlight: 'NH 48 Southbound Start',
          isOrigin: true,
        },
        {
          id: 'wp_pk_1',
          name: 'Khed Shivapur Toll Plaza',
          localName: { hi: 'खेड शिवापूर टोल', mr: 'खेड शिवापूर टोल नाका' },
          distanceKm: 24,
          lat: 18.3489,
          lng: 73.8742,
          defaultHighlight: 'Fastag Toll Gate',
        },
        {
          id: 'wp_pk_2',
          name: 'Shirwal & Nira River Bridge',
          localName: { hi: 'शिरवळ व निरा नदी पूल', mr: 'शिरवळ व नीरा नदी पूल' },
          distanceKm: 50,
          lat: 18.1345,
          lng: 73.9877,
          defaultHighlight: 'MIDC Fuel & Refreshment Stoppage',
        },
        {
          id: 'wp_pk_3',
          name: 'Khambatki Ghat & Anewadi Toll',
          localName: { hi: 'खंबाटकी घाट व आनेवाडी टोल', mr: 'खंबाटकी घाट व आनेवाडी टोल' },
          distanceKm: 85,
          lat: 17.8456,
          lng: 74.0125,
          defaultHighlight: 'Mountain Tunnel & Satara District Entry',
        },
        {
          id: 'wp_pk_4',
          name: 'Satara City (Bombay Restaurant Chowk)',
          localName: { hi: 'सातारा बायपास', mr: 'सातारा बायपास चौक' },
          distanceKm: 112,
          lat: 17.6805,
          lng: 73.9930,
          defaultHighlight: 'Famous Satara Kandi Pedha Hub',
        },
        {
          id: 'wp_pk_5',
          name: 'Karad & Taswade Toll Plaza',
          localName: { hi: 'कराड व तासवडे टोल', mr: 'कराड व तासवडे टोल' },
          distanceKm: 168,
          lat: 17.2885,
          lng: 74.1844,
          defaultHighlight: 'Preeti Sangam Town • Vithal Kamat Food Hub',
        },
        {
          id: 'wp_pk_6',
          name: 'Peth Naka / Islampur Junction',
          localName: { hi: 'पेठ नाका / इस्लामपूर', mr: 'पेठ नाका / इस्लामपूर फाटा' },
          distanceKm: 195,
          lat: 17.0789,
          lng: 74.2456,
          defaultHighlight: 'Sangli District Highway Crossing',
        },
        {
          id: 'wp_pk_7',
          name: 'Kini Toll Plaza & Shiroli MIDC',
          localName: { hi: 'किणी टोल व शिरोली', mr: 'किणी टोल व शिरोली' },
          distanceKm: 225,
          lat: 16.7458,
          lng: 74.2798,
          defaultHighlight: 'Final Highway Toll before City Entry',
        },
        {
          id: 'wp_pk_8',
          name: destination.name.split(',')[0],
          localName: { hi: 'कोल्हापुर (महालक्ष्मी मंदिर)', mr: 'कोल्हापूर (महालक्ष्मी मंदिर)' },
          distanceKm: totalDistKm,
          lat: destination.lat,
          lng: destination.lng,
          defaultHighlight: 'Historic Kolhapur Arrival',
          isDestination: true,
        },
      ];
    }

    // 6. Mumbai <-> Goa (NH 66 Konkan Coast Highway)
    else if (
      (isMumb(originClean) && isGoa(destClean)) ||
      (isGoa(originClean) && isMumb(destClean))
    ) {
      specs = [
        {
          id: 'wp_mg_0',
          name: origin.name.split(',')[0],
          localName: { hi: 'पनवेल (शुरुआत)', mr: 'पनवेल (सुरुवात)' },
          distanceKm: 0,
          lat: origin.lat,
          lng: origin.lng,
          defaultHighlight: 'Start of NH 66 Coastal Highway',
          isOrigin: true,
        },
        {
          id: 'wp_mg_1',
          name: 'Karnala & Pen Vadkhal Junction',
          localName: { hi: 'कर्नाळा व वडखळ नाका', mr: 'कर्नाळा व वडखळ नाका' },
          distanceKm: 42,
          lat: 18.7369,
          lng: 73.0931,
          defaultHighlight: 'Alibaug Divergence • Coastal Flora Stretch',
        },
        {
          id: 'wp_mg_2',
          name: 'Mangaon & Lonere Highway Hub',
          localName: { hi: 'माणगांव व लोणेरे', mr: 'माणगाव व लोणेरे' },
          distanceKm: 110,
          lat: 18.2561,
          lng: 73.2872,
          defaultHighlight: 'Open Umbrella Food Lounge & COCO Fuel',
        },
        {
          id: 'wp_mg_3',
          name: 'Mahad (Gandharpale Caves Cut)',
          localName: { hi: 'महाड (रायगड मार्ग)', mr: 'महाड (रायगड मार्ग)' },
          distanceKm: 145,
          lat: 18.0825,
          lng: 73.4186,
          defaultHighlight: 'Historical Gateway to Fort Raigad',
        },
        {
          id: 'wp_mg_4',
          name: 'Poladpur & Kashedi Tunnel',
          localName: { hi: 'पोलादपूर व कशेडी बोगदा', mr: 'पोलादपूर व कशेडी बोगदा' },
          distanceKm: 175,
          lat: 17.9825,
          lng: 73.4689,
          defaultHighlight: 'New Twin Tube Tunnel • Bypasses Old Ghat',
        },
        {
          id: 'wp_mg_5',
          name: 'Chiplun & Parshuram Ghat',
          localName: { hi: 'चिपळूण व परशुराम घाट', mr: 'चिपळूण व परशुराम घाट' },
          distanceKm: 245,
          lat: 17.5328,
          lng: 73.5186,
          defaultHighlight: 'Vashishti River View • Abhishek Food Hub',
        },
        {
          id: 'wp_mg_6',
          name: 'Sangameshwar & Shastri River',
          localName: { hi: 'संगमेश्वर', mr: 'संगमेश्वर' },
          distanceKm: 295,
          lat: 17.1856,
          lng: 73.5512,
          defaultHighlight: 'Ganpatipule Divergence Point',
        },
        {
          id: 'wp_mg_7',
          name: 'Lanja & Rajapur Mango Valley',
          localName: { hi: 'लांजा व राजापूर', mr: 'लांजा व राजापूर' },
          distanceKm: 370,
          lat: 16.6542,
          lng: 73.5189,
          defaultHighlight: 'Alphonso Mango Orchards Belt',
        },
        {
          id: 'wp_mg_8',
          name: 'Kankavli Central (Sindhudurg)',
          localName: { hi: 'कणकवली', mr: 'कणकवली' },
          distanceKm: 450,
          lat: 16.2736,
          lng: 73.7142,
          defaultHighlight: 'Malvan & Tarkarli Beach Divergence',
        },
        {
          id: 'wp_mg_9',
          name: 'Sawantwadi & Goa Border (Banda)',
          localName: { hi: 'सावंतवाडी व बांदा', mr: 'सावंतवाडी व बांदा' },
          distanceKm: 510,
          lat: 15.9056,
          lng: 73.8214,
          defaultHighlight: 'Moti Talao • State Border Checkpost',
        },
        {
          id: 'wp_mg_10',
          name: destination.name.split(',')[0],
          localName: { hi: 'गोवा (आगमन)', mr: 'गोवा (आगमन)' },
          distanceKm: totalDistKm,
          lat: destination.lat,
          lng: destination.lng,
          defaultHighlight: 'Tropical Beach Haven Arrival',
          isDestination: true,
        },
      ];
    }

    // 7. Pune <-> Nashik (NH 60 via Sangamner)
    else if (
      (isPune(originClean) && isNashik(destClean)) ||
      (isNashik(originClean) && isPune(destClean))
    ) {
      specs = [
        {
          id: 'wp_pn_0',
          name: origin.name.split(',')[0],
          localName: { hi: 'पुणे / भोसरी', mr: 'पुणे / भोसरी' },
          distanceKm: 0,
          lat: origin.lat,
          lng: origin.lng,
          defaultHighlight: 'NH 60 Northbound Start',
          isOrigin: true,
        },
        {
          id: 'wp_pn_1',
          name: 'Chakan Automobile Hub',
          localName: { hi: 'चाकण एमआयडीसी चौक', mr: 'चाकण एमआयडीसी चौक' },
          distanceKm: 26,
          lat: 18.7606,
          lng: 73.8569,
          defaultHighlight: 'Heavy Industrial Traffic Stretch',
        },
        {
          id: 'wp_pn_2',
          name: 'Manchar & Peth Toll',
          localName: { hi: 'मंचर व पेठ टोल', mr: 'मंचर व पेठ टोल' },
          distanceKm: 68,
          lat: 19.0012,
          lng: 73.9421,
          defaultHighlight: 'Fastag Toll Plaza • Fresh Farm Produce Hub',
        },
        {
          id: 'wp_pn_3',
          name: 'Narayangaon & Junnar Junction',
          localName: { hi: 'नारायणगाव', mr: 'नारायणगाव' },
          distanceKm: 82,
          lat: 19.1245,
          lng: 73.9782,
          defaultHighlight: 'Fort Shivneri & Ozar Ganpati Cut',
        },
        {
          id: 'wp_pn_4',
          name: 'Alephata Junction (NH 61 Cross)',
          localName: { hi: 'आळेफाटा जंक्शन', mr: 'आळेफाटा जंक्शन' },
          distanceKm: 96,
          lat: 19.2156,
          lng: 74.1025,
          defaultHighlight: 'Major Rest Stop • Sai Heritage Food Court',
        },
        {
          id: 'wp_pn_5',
          name: 'Sangamner Bypass & Ghargaon Ghat',
          localName: { hi: 'संगमनेर बायपास', mr: 'संगमनेर बायपास' },
          distanceKm: 142,
          lat: 19.5772,
          lng: 74.2155,
          defaultHighlight: 'Smooth 4-lane Highway Stretch',
        },
        {
          id: 'wp_pn_6',
          name: 'Sinnar Industrial Zone',
          localName: { hi: 'सिन्नर एमआयडीसी', mr: 'सिन्नर एमआयडीसी' },
          distanceKm: 180,
          lat: 19.8456,
          lng: 74.0049,
          defaultHighlight: 'Samruddhi Mahamarg Cross Connection',
        },
        {
          id: 'wp_pn_7',
          name: destination.name.split(',')[0],
          localName: { hi: 'नासिक (द्वारका चौक)', mr: 'नाशिक (द्वारका चौक)' },
          distanceKm: totalDistKm,
          lat: destination.lat,
          lng: destination.lng,
          defaultHighlight: 'Nashik Arrival',
          isDestination: true,
        },
      ];
    }

    // 8. Mumbai <-> Alibaug (via Atal Setu MTHL & Chirle)
    else if (
      (isMumb(originClean) && isAlibaug(destClean)) ||
      (isAlibaug(originClean) && isMumb(destClean))
    ) {
      specs = [
        {
          id: 'wp_ma_0',
          name: origin.name.split(',')[0],
          localName: { hi: 'मुंबई (शिवडी / दक्षिण)', mr: 'मुंबई (शिवडी / दक्षिण)' },
          distanceKm: 0,
          lat: origin.lat,
          lng: origin.lng,
          defaultHighlight: 'Journey Origin',
          isOrigin: true,
        },
        {
          id: 'wp_ma_1',
          name: 'Atal Setu (MTHL 21.8 km Sea Bridge)',
          localName: { hi: 'अटल सेतू (एमटीएचएल)', mr: 'अटल सेतू (एमटीएचएल सागरी सेतू)' },
          distanceKm: 18,
          lat: 18.9654,
          lng: 72.9512,
          defaultHighlight: 'India’s Longest Sea Bridge • 100 km/h Open Deck',
        },
        {
          id: 'wp_ma_2',
          name: 'Chirle Interchange & JNPT Highway',
          localName: { hi: 'चिरले इंटरचेंज', mr: 'चिरले इंटरचेंज' },
          distanceKm: 28,
          lat: 18.9056,
          lng: 72.9982,
          defaultHighlight: 'Smooth Expressway Exit towards Alibaug',
        },
        {
          id: 'wp_ma_3',
          name: 'Pen Bypass & Dharamtar Creek',
          localName: { hi: 'पेण बायपास व धरमतर खाडी', mr: 'पेण बायपास व धरमतर खाडी' },
          distanceKm: 58,
          lat: 18.7369,
          lng: 73.0931,
          defaultHighlight: 'Scenic Coastal Bridge Crossing',
        },
        {
          id: 'wp_ma_4',
          name: 'Poynad Market & Wadkhal Junction',
          localName: { hi: 'पोयनाड बाजार', mr: 'पोयनाड बाजार व ढाबे' },
          distanceKm: 76,
          lat: 18.6812,
          lng: 72.9856,
          defaultHighlight: 'Famous Local Seafood & Coconut Water Stalls',
        },
        {
          id: 'wp_ma_5',
          name: 'Khandale & Varsoli Beach Cut',
          localName: { hi: 'खंडाळे व वरसोली फाटा', mr: 'खंडाळे व वरसोली फाटा' },
          distanceKm: 92,
          lat: 18.6653,
          lng: 72.8686,
          defaultHighlight: 'Alibaug Town Outer Approach',
        },
        {
          id: 'wp_ma_6',
          name: destination.name.split(',')[0],
          localName: { hi: 'अलिबाग (समुद्र किनारा)', mr: 'अलिबाग (समुद्रकिनारा)' },
          distanceKm: totalDistKm,
          lat: destination.lat,
          lng: destination.lng,
          defaultHighlight: 'Coastal Paradise Arrival',
          isDestination: true,
        },
      ];
    }

    // 9. Mumbai/Pune <-> Shirdi (Pilgrimage Corridor)
    else if (isShirdi(destClean) || isShirdi(originClean)) {
      const isFromMumbai = isMumb(originClean) || isMumb(destClean);
      if (isFromMumbai) {
        specs = [
          {
            id: 'wp_msh_0',
            name: origin.name.split(',')[0],
            distanceKm: 0,
            lat: origin.lat,
            lng: origin.lng,
            defaultHighlight: 'Pilgrimage Start',
            isOrigin: true,
          },
          {
            id: 'wp_msh_1',
            name: 'Kasara Ghat & Igatpuri',
            distanceKm: 118,
            lat: 19.6967,
            lng: 73.5614,
            defaultHighlight: 'Sahyadri Ghat Crossing',
          },
          {
            id: 'wp_msh_2',
            name: 'Sinnar Highway Bypass',
            distanceKm: 180,
            lat: 19.8456,
            lng: 74.0049,
            defaultHighlight: 'Samruddhi Mahamarg Shirdi Spur',
          },
          {
            id: 'wp_msh_3',
            name: destination.name.split(',')[0],
            localName: { hi: 'शिर्डी साईबाबा मंदिर', mr: 'शिर्डी साईबाबा समाधी मंदिर' },
            distanceKm: totalDistKm,
            lat: destination.lat,
            lng: destination.lng,
            defaultHighlight: 'Shri Saibaba Sansthan Arrival',
            isDestination: true,
          },
        ];
      } else {
        specs = [
          {
            id: 'wp_psh_0',
            name: origin.name.split(',')[0],
            distanceKm: 0,
            lat: origin.lat,
            lng: origin.lng,
            defaultHighlight: 'Pune Origin',
            isOrigin: true,
          },
          {
            id: 'wp_psh_1',
            name: 'Ranjangaon Mahaganapati Temple',
            distanceKm: 55,
            lat: 18.7556,
            lng: 74.2417,
            defaultHighlight: 'Ashtavinayak Darshan Stoppage',
          },
          {
            id: 'wp_psh_2',
            name: 'Ahmednagar / Ahilyanagar Bypass',
            distanceKm: 118,
            lat: 19.0952,
            lng: 74.7480,
            defaultHighlight: 'Major District Highway Crossing',
          },
          {
            id: 'wp_psh_3',
            name: 'Rahuri & Rahata Market',
            distanceKm: 172,
            lat: 19.3872,
            lng: 74.6512,
            defaultHighlight: 'Approach to Shirdi Sansthan',
          },
          {
            id: 'wp_psh_4',
            name: destination.name.split(',')[0],
            localName: { hi: 'शिर्डी साईबाबा मंदिर', mr: 'शिर्डी साईबाबा समाधी मंदिर' },
            distanceKm: totalDistKm,
            lat: destination.lat,
            lng: destination.lng,
            defaultHighlight: 'Shri Saibaba Sansthan Arrival',
            isDestination: true,
          },
        ];
      }
    }

    // 10. Pune <-> Pandharpur (Palkhi Marg / Vitthal Darshan Corridor)
    else if (
      (isPune(originClean) && isPandharpur(destClean)) ||
      (isPandharpur(originClean) && isPune(destClean))
    ) {
      specs = [
        {
          id: 'wp_pp_0',
          name: origin.name.split(',')[0],
          localName: { hi: 'पुणे (हडपसर)', mr: 'पुणे (हडपसर)' },
          distanceKm: 0,
          lat: origin.lat,
          lng: origin.lng,
          defaultHighlight: 'Start of Palkhi Marg Corridor',
          isOrigin: true,
        },
        {
          id: 'wp_pp_1',
          name: 'Loni Kalbhor & Uruli Kanchan',
          localName: { hi: 'उरुळी कांचन', mr: 'उरुळी कांचन' },
          distanceKm: 28,
          lat: 18.4891,
          lng: 74.1356,
          defaultHighlight: 'Solapur Highway Fastag Stretch',
        },
        {
          id: 'wp_pp_2',
          name: 'Yawat & Kedgaon',
          localName: { hi: 'यवत व केडगाव', mr: 'यवत व केडगाव' },
          distanceKm: 56,
          lat: 18.4654,
          lng: 74.3412,
          defaultHighlight: 'Highway Dhabas & Fuel Hub',
        },
        {
          id: 'wp_pp_3',
          name: 'Bhigwan (Bird Sanctuary Lake)',
          localName: { hi: 'भिगवण पक्षी अभयारण्य', mr: 'भिगवण पक्षी अभयारण्य' },
          distanceKm: 105,
          lat: 18.2912,
          lng: 74.7542,
          defaultHighlight: 'Ujani Dam Backwaters • Famous Fish Thali',
        },
        {
          id: 'wp_pp_4',
          name: 'Indapur Bypass & Toll',
          localName: { hi: 'इंदापूर बायपास', mr: 'इंदापूर बायपास व टोल' },
          distanceKm: 140,
          lat: 18.1122,
          lng: 75.0256,
          defaultHighlight: 'Exit NH 65 toward Pandharpur',
        },
        {
          id: 'wp_pp_5',
          name: 'Tembhurni Junction',
          localName: { hi: 'टेंभुर्णी जंक्शन', mr: 'टेंभुर्णी जंक्शन' },
          distanceKm: 172,
          lat: 18.0542,
          lng: 75.2412,
          defaultHighlight: 'Palkhi Marg Connecting Point',
        },
        {
          id: 'wp_pp_6',
          name: destination.name.split(',')[0],
          localName: { hi: 'पंढरपुर (विठ्ठल मंदिर)', mr: 'पंढरपूर (श्री विठ्ठल रुक्मिणी मंदिर)' },
          distanceKm: totalDistKm,
          lat: destination.lat,
          lng: destination.lng,
          defaultHighlight: 'Chandrabhaga Holy River Arrival',
          isDestination: true,
        },
      ];
    }

    // 11. Chhatrapati Sambhajinagar <-> Pune Corridor (via Ahmednagar)
    else if (
      (isSambhajinagar(originClean) && isPune(destClean)) ||
      (isPune(originClean) && isSambhajinagar(destClean))
    ) {
      specs = [
        {
          id: 'wp_sp_0',
          name: origin.name.split(',')[0],
          localName: { hi: 'छ. संभाजीनगर / पुणे', mr: 'छ. संभाजीनगर / पुणे' },
          distanceKm: 0,
          lat: origin.lat,
          lng: origin.lng,
          defaultHighlight: 'Start of Sambhajinagar-Pune Corridor',
          isOrigin: true,
        },
        {
          id: 'wp_sp_1',
          name: 'Waluj Industrial MIDC',
          localName: { hi: 'वाळूज एमआयडीसी', mr: 'वाळूज एमआयडीसी' },
          distanceKm: 18,
          lat: 19.8322,
          lng: 75.2156,
          defaultHighlight: 'Manufacturing Belt Exit',
        },
        {
          id: 'wp_sp_2',
          name: 'Nevasa Phata & Shani Shingnapur Cut',
          localName: { hi: 'नेवासा फाटा', mr: 'नेवासा फाटा' },
          distanceKm: 65,
          lat: 19.4654,
          lng: 74.9212,
          defaultHighlight: 'Pilgrim Divergence Stoppage',
        },
        {
          id: 'wp_sp_3',
          name: 'Ahilyanagar / Ahmednagar Bypass',
          localName: { hi: 'अहिल्यानगर बायपास', mr: 'अहिल्यानगर बायपास' },
          distanceKm: 115,
          lat: 19.0952,
          lng: 74.7480,
          defaultHighlight: 'Halfway Highway Crossing • Restaurants & Fuel',
        },
        {
          id: 'wp_sp_4',
          name: 'Shirur MIDC & Ghod River',
          localName: { hi: 'शिरूर एमआयडीसी', mr: 'शिरूर एमआयडीसी' },
          distanceKm: 175,
          lat: 18.8256,
          lng: 74.3789,
          defaultHighlight: 'Pune District Border Crossing',
        },
        {
          id: 'wp_sp_5',
          name: 'Ranjangaon Mahaganapati Plaza',
          localName: { hi: 'रांजणगाव महागणपती', mr: 'रांजणगाव महागणपती' },
          distanceKm: 195,
          lat: 18.7556,
          lng: 74.2417,
          defaultHighlight: 'Ashtavinayak Shrine • Highway Food Plaza',
        },
        {
          id: 'wp_sp_6',
          name: 'Wagholi & Shikrapur Entry',
          localName: { hi: 'वाघोली / शिक्रापूर', mr: 'वाघोली / शिक्रापूर' },
          distanceKm: 228,
          lat: 18.5812,
          lng: 73.9856,
          defaultHighlight: 'Pune Eastern Tech Corridor Entry',
        },
        {
          id: 'wp_sp_7',
          name: destination.name.split(',')[0],
          localName: { hi: 'पुणे / संभाजीनगर (पहुंच)', mr: 'पुणे / संभाजीनगर (आगमन)' },
          distanceKm: totalDistKm,
          lat: destination.lat,
          lng: destination.lng,
          defaultHighlight: 'City Destination Arrival',
          isDestination: true,
        },
      ];
    }

    // 12. Nagpur <-> Amravati (NH 53 Vidarbha Corridor)
    else if (
      (isNagpur(originClean) && isAmravati(destClean)) ||
      (isAmravati(originClean) && isNagpur(destClean))
    ) {
      specs = [
        {
          id: 'wp_na_0',
          name: origin.name.split(',')[0],
          localName: { hi: 'नागपुर / अमरावती', mr: 'नागपूर / अमरावती' },
          distanceKm: 0,
          lat: origin.lat,
          lng: origin.lng,
          defaultHighlight: 'NH 53 Vidarbha Route Start',
          isOrigin: true,
        },
        {
          id: 'wp_na_1',
          name: 'Kondhali & Bazargaon',
          localName: { hi: 'कोंढाळी व बाजारगाव', mr: 'कोंढाळी व बाजारगाव' },
          distanceKm: 48,
          lat: 21.1256,
          lng: 78.6542,
          defaultHighlight: 'Forest Ghat & Highway Dhabas',
        },
        {
          id: 'wp_na_2',
          name: 'Talegaon Shyamji Pant & Wardha River',
          localName: { hi: 'तळेगाव श्यामजी पंत', mr: 'तळेगाव श्यामजी पंत' },
          distanceKm: 95,
          lat: 20.9856,
          lng: 78.2145,
          defaultHighlight: 'River Bridge Crossing • Fuel COCO',
        },
        {
          id: 'wp_na_3',
          name: 'Tiwnsa & Nandgaon Peth MIDC',
          localName: { hi: 'तिवसा व नांदगाव पेठ', mr: 'तिवसा व नांदगाव पेठ' },
          distanceKm: 132,
          lat: 20.9542,
          lng: 77.9256,
          defaultHighlight: 'Amravati Textile Park Approach',
        },
        {
          id: 'wp_na_4',
          name: destination.name.split(',')[0],
          localName: { hi: 'अमरावती / नागपुर', mr: 'अमरावती / नागपूर' },
          distanceKm: totalDistKm,
          lat: destination.lat,
          lng: destination.lng,
          defaultHighlight: 'Destination Arrival',
          isDestination: true,
        },
      ];
    }

    // 13. Delhi <-> Jaipur Corridor (NH 48)
    else if (
      (originClean.includes('delhi') || originClean.includes('gurgaon')) &&
      destClean.includes('jaipur')
    ) {
      specs = [
        {
          id: 'wp_dj_0',
          name: origin.name.split(',')[0],
          distanceKm: 0,
          lat: origin.lat,
          lng: origin.lng,
          defaultHighlight: 'Journey Origin',
          isOrigin: true,
        },
        {
          id: 'wp_dj_1',
          name: 'Gurugram (Kherki Daula Toll)',
          distanceKm: 34,
          lat: 28.399,
          lng: 76.974,
          defaultHighlight: 'Fastag Toll Plaza',
        },
        {
          id: 'wp_dj_2',
          name: 'Dharuhera & Manesar Industrial',
          distanceKm: 68,
          lat: 28.214,
          lng: 76.804,
          defaultHighlight: 'Popular Highway Dhabas',
        },
        {
          id: 'wp_dj_3',
          name: 'Behror Highway Midway & Oasis',
          distanceKm: 126,
          lat: 27.892,
          lng: 76.284,
          defaultHighlight: 'Highway King • Fuel COCO • Restrooms',
        },
        {
          id: 'wp_dj_4',
          name: 'Kotputli & Shahpura Bypass',
          distanceKm: 198,
          lat: 27.531,
          lng: 75.962,
          defaultHighlight: 'Expressway Toll Gate',
        },
        {
          id: 'wp_dj_5',
          name: destination.name.split(',')[0],
          distanceKm: totalDistKm,
          lat: destination.lat,
          lng: destination.lng,
          defaultHighlight: 'Pink City Arrival',
          isDestination: true,
        },
      ];
    }

    // 12. Generic Dynamic Milestones for any other Maharashtra / Indian route
    else {
      specs = [
        {
          id: 'wp_gen_0',
          name: origin.name.split(',')[0],
          distanceKm: 0,
          lat: origin.lat,
          lng: origin.lng,
          defaultHighlight: 'Start of Journey',
          isOrigin: true,
        },
      ];

      if (totalDistKm >= 25) {
        const hasPoints = route.polyline && route.polyline.length >= 4;
        const p1 = hasPoints
          ? route.polyline[Math.floor(route.polyline.length * 0.25)]
          : [origin.lat + (destination.lat - origin.lat) * 0.25, origin.lng + (destination.lng - origin.lng) * 0.25];
        const p2 = hasPoints
          ? route.polyline[Math.floor(route.polyline.length * 0.5)]
          : [origin.lat + (destination.lat - origin.lat) * 0.5, origin.lng + (destination.lng - origin.lng) * 0.5];
        const p3 = hasPoints
          ? route.polyline[Math.floor(route.polyline.length * 0.75)]
          : [origin.lat + (destination.lat - origin.lat) * 0.75, origin.lng + (destination.lng - origin.lng) * 0.75];

        specs.push({
          id: 'wp_gen_1',
          name: 'First Highway Milestone',
          distanceKm: Math.round(totalDistKm * 0.25),
          lat: p1[0],
          lng: p1[1],
          defaultHighlight: 'City Exit Stretch',
        });

        specs.push({
          id: 'wp_gen_2',
          name: 'Midway Rest & Toll Crossing',
          distanceKm: Math.round(totalDistKm * 0.5),
          lat: p2[0],
          lng: p2[1],
          defaultHighlight: 'Highway Midway Junction',
        });

        specs.push({
          id: 'wp_gen_3',
          name: 'Approaching Destination District',
          distanceKm: Math.round(totalDistKm * 0.75),
          lat: p3[0],
          lng: p3[1],
          defaultHighlight: 'Outer Ring Entry',
        });
      }

      specs.push({
        id: 'wp_gen_dest',
        name: destination.name.split(',')[0],
        distanceKm: totalDistKm,
        lat: destination.lat,
        lng: destination.lng,
        defaultHighlight: 'Trip Destination',
        isDestination: true,
      });
    }

    // Authentically resolve live status for each milestone against real live trafficSegments
    return specs.map((spec) => {
      const fraction = totalDistKm > 0 ? spec.distanceKm / totalDistKm : 0;
      const eta = calcEta(fraction);

      const liveMatch = this.findMatchingTrafficSegment(
        spec.lat,
        spec.lng,
        route.trafficSegments
      );

      let status: WaypointStatus = 'CLEAR';
      let delaySeconds = 0;
      let highlight = spec.defaultHighlight;

      if (liveMatch && liveMatch.delaySeconds > 30) {
        status =
          liveMatch.congestionLevel === 'SEVERE' || liveMatch.congestionLevel === 'HEAVY'
            ? 'CONGESTED'
            : 'MODERATE';
        delaySeconds = liveMatch.delaySeconds;
        highlight = `${liveMatch.roadName} (+${Math.round(delaySeconds / 60)}m delay)`;
      }

      return {
        id: spec.id,
        name: spec.name,
        localName: spec.localName,
        distanceKm: spec.distanceKm,
        estimatedArrival: eta,
        status,
        delaySeconds,
        highlight,
        isOrigin: spec.isOrigin,
        isDestination: spec.isDestination,
      };
    });
  }

  private findMatchingTrafficSegment(
    lat: number,
    lng: number,
    segments: TrafficSegment[]
  ): TrafficSegment | null {
    if (!segments || segments.length === 0) return null;

    for (const seg of segments) {
      const dStart = calculateHaversineDistance([lat, lng], seg.startPoint);
      const dEnd = calculateHaversineDistance([lat, lng], seg.endPoint);
      if (dStart <= 5000 || dEnd <= 5000) {
        return seg;
      }
    }
    return null;
  }
}

export const intermediateTownsService = new IntermediateTownsService();
