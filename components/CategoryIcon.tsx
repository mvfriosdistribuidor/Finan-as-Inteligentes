import React from 'react';
import { 
  Utensils, Car, ShoppingCart, Coffee, Home, Zap, 
  Briefcase, Gift, Music, Heart, DollarSign, Fuel, 
  Bus, Plane, GraduationCap, Gamepad2, AlertCircle,
  Bike, Tag, Wifi, Truck, Package, Users, BadgeCheck,
  Pill, Activity, Store, Globe, Hammer, Wrench, Shirt, Smartphone,
  Droplets
} from 'lucide-react';

export const ICON_KEYS = [
  'utensils', 'car', 'bike', 'shopping-cart', 'coffee', 'home', 
  'zap', 'fuel', 'wifi', 'truck', 'package', 'users', 'badge-check',
  'briefcase', 'gift', 'music', 'heart', 'dollar-sign', 
  'bus', 'plane', 'graduation-cap', 'gamepad-2',
  'pill', 'activity', 'store', 'globe', 'hammer', 'wrench', 'shirt', 'smartphone',
  'droplets'
];

interface CategoryIconProps {
  iconName?: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ iconName, size = 20, className, strokeWidth = 2 }) => {
  const props = { size, className, strokeWidth };
  
  switch (iconName) {
    case 'utensils': return <Utensils {...props} />;
    case 'car': return <Car {...props} />;
    case 'bike': return <Bike {...props} />;
    case 'shopping-cart': return <ShoppingCart {...props} />;
    case 'coffee': return <Coffee {...props} />;
    case 'home': return <Home {...props} />;
    case 'zap': return <Zap {...props} />;
    case 'fuel': return <Fuel {...props} />;
    case 'wifi': return <Wifi {...props} />;
    case 'truck': return <Truck {...props} />;
    case 'package': return <Package {...props} />;
    case 'users': return <Users {...props} />;
    case 'badge-check': return <BadgeCheck {...props} />;
    case 'briefcase': return <Briefcase {...props} />;
    case 'gift': return <Gift {...props} />;
    case 'music': return <Music {...props} />;
    case 'heart': return <Heart {...props} />;
    case 'dollar-sign': return <DollarSign {...props} />;
    case 'bus': return <Bus {...props} />;
    case 'plane': return <Plane {...props} />;
    case 'graduation-cap': return <GraduationCap {...props} />;
    case 'gamepad-2': return <Gamepad2 {...props} />;
    // Novos ícones
    case 'pill': return <Pill {...props} />;
    case 'activity': return <Activity {...props} />;
    case 'store': return <Store {...props} />;
    case 'globe': return <Globe {...props} />;
    case 'hammer': return <Hammer {...props} />;
    case 'wrench': return <Wrench {...props} />;
    case 'shirt': return <Shirt {...props} />;
    case 'smartphone': return <Smartphone {...props} />;
    case 'droplets': return <Droplets {...props} />;
    default: return <Tag {...props} />;
  }
};

export default CategoryIcon;