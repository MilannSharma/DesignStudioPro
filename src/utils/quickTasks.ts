/**
 * Quick Tasks — Pre-coded design operations that run instantly without AI
 * These bypass the Gemini API entirely for maximum speed and reliability
 */

import { AIAction } from './aiEngine';

export interface QuickTask {
  id: string;
  label: string;
  icon: string;
  category: 'canvas' | 'text' | 'shapes' | 'layout' | 'style' | 'data' | 'transform';
  description: string;
  actions: AIAction[];
}

export const QUICK_TASKS: QuickTask[] = [
  // ═══════════════════════════════════════
  // CANVAS OPERATIONS
  // ═══════════════════════════════════════
  {
    id: 'resize_id_card_h',
    label: 'ID Card (Horizontal)',
    icon: '🪪',
    category: 'canvas',
    description: 'Resize to horizontal ID card (86×54mm)',
    actions: [{ type: 'resize_canvas', params: { width: 1012, height: 636 }, description: 'Set canvas to horizontal ID card (86×54mm)' }]
  },
  {
    id: 'resize_id_card_v',
    label: 'ID Card (Vertical)',
    icon: '🪪',
    category: 'canvas',
    description: 'Resize to vertical ID card (54×86mm)',
    actions: [{ type: 'resize_canvas', params: { width: 636, height: 1012 }, description: 'Set canvas to vertical ID card (54×86mm)' }]
  },
  {
    id: 'resize_business_card',
    label: 'Business Card',
    icon: '💼',
    category: 'canvas',
    description: 'Resize to business card (3.5×2 inch)',
    actions: [{ type: 'resize_canvas', params: { width: 1050, height: 600 }, description: 'Set canvas to business card size' }]
  },
  {
    id: 'resize_a4',
    label: 'A4 Portrait',
    icon: '📄',
    category: 'canvas',
    description: 'Resize to A4 portrait',
    actions: [{ type: 'resize_canvas', params: { width: 794, height: 1123 }, description: 'Set canvas to A4 portrait' }]
  },
  {
    id: 'resize_a4_land',
    label: 'A4 Landscape',
    icon: '📃',
    category: 'canvas',
    description: 'Resize to A4 landscape',
    actions: [{ type: 'resize_canvas', params: { width: 1123, height: 794 }, description: 'Set canvas to A4 landscape' }]
  },
  {
    id: 'resize_certificate',
    label: 'Certificate',
    icon: '🏆',
    category: 'canvas',
    description: 'Resize to certificate (10×8 inch)',
    actions: [{ type: 'resize_canvas', params: { width: 1200, height: 900 }, description: 'Set canvas to certificate size' }]
  },
  {
    id: 'resize_instagram',
    label: 'Instagram Post',
    icon: '📷',
    category: 'canvas',
    description: 'Resize to Instagram square (1080×1080)',
    actions: [{ type: 'resize_canvas', params: { width: 1080, height: 1080 }, description: 'Set canvas to Instagram post' }]
  },
  {
    id: 'resize_story',
    label: 'Story / Reel',
    icon: '📱',
    category: 'canvas',
    description: 'Resize to story size (1080×1920)',
    actions: [{ type: 'resize_canvas', params: { width: 1080, height: 1920 }, description: 'Set canvas to story/reel size' }]
  },
  {
    id: 'bg_white',
    label: 'White Background',
    icon: '⬜',
    category: 'canvas',
    description: 'Set background to white',
    actions: [{ type: 'change_bg', params: { color: '#ffffff' }, description: 'White background' }]
  },
  {
    id: 'bg_black',
    label: 'Dark Background',
    icon: '⬛',
    category: 'canvas',
    description: 'Set background to dark',
    actions: [{ type: 'change_bg', params: { color: '#1a1a2e' }, description: 'Dark background' }]
  },
  {
    id: 'bg_blue',
    label: 'Blue Background',
    icon: '🟦',
    category: 'canvas',
    description: 'Set background to professional blue',
    actions: [{ type: 'change_bg', params: { color: '#1e3a5f' }, description: 'Blue background' }]
  },
  {
    id: 'bg_gradient_blue',
    label: 'Light Blue BG',
    icon: '🔵',
    category: 'canvas',
    description: 'Set background to light blue',
    actions: [{ type: 'change_bg', params: { color: '#e3f2fd' }, description: 'Light blue background' }]
  },

  // ═══════════════════════════════════════
  // TEXT OPERATIONS
  // ═══════════════════════════════════════
  {
    id: 'add_title',
    label: 'Add Title',
    icon: '🔤',
    category: 'text',
    description: 'Add a large title text',
    actions: [{ type: 'add_text', params: { text: 'TITLE', x: 400, y: 50, fontSize: 48, fontFamily: 'Arial', color: '#1a1a1a', bold: true }, description: 'Add title text' }]
  },
  {
    id: 'add_subtitle',
    label: 'Add Subtitle',
    icon: '📝',
    category: 'text',
    description: 'Add a medium subtitle',
    actions: [{ type: 'add_text', params: { text: 'Subtitle Text', x: 400, y: 120, fontSize: 24, fontFamily: 'Arial', color: '#555555' }, description: 'Add subtitle' }]
  },
  {
    id: 'add_body_text',
    label: 'Body Text',
    icon: '📋',
    category: 'text',
    description: 'Add body paragraph text',
    actions: [{ type: 'add_text', params: { text: 'Enter your text here...', x: 50, y: 200, fontSize: 14, fontFamily: 'Arial', color: '#333333' }, description: 'Add body text' }]
  },
  {
    id: 'add_name_field',
    label: 'Name Field',
    icon: '👤',
    category: 'text',
    description: 'Add student/employee name field',
    actions: [{ type: 'add_field', params: { fieldName: 'student_name', x: 300, y: 200, fontSize: 22, color: '#1a1a1a' }, description: 'Add name data field' }]
  },
  {
    id: 'add_roll_field',
    label: 'Roll No. Field',
    icon: '🔢',
    category: 'text',
    description: 'Add roll number field',
    actions: [{ type: 'add_field', params: { fieldName: 'roll_no', x: 300, y: 240, fontSize: 16, color: '#333333' }, description: 'Add roll number field' }]
  },
  {
    id: 'add_class_field',
    label: 'Class Field',
    icon: '🏫',
    category: 'text',
    description: 'Add class/section field',
    actions: [{ type: 'add_field', params: { fieldName: 'class', x: 300, y: 280, fontSize: 16, color: '#333333' }, description: 'Add class field' }]
  },
  {
    id: 'add_dob_field',
    label: 'DOB Field',
    icon: '📅',
    category: 'text',
    description: 'Add date of birth field',
    actions: [{ type: 'add_field', params: { fieldName: 'dob', x: 300, y: 320, fontSize: 14, color: '#555555' }, description: 'Add DOB field' }]
  },
  {
    id: 'add_address_field',
    label: 'Address Field',
    icon: '🏠',
    category: 'text',
    description: 'Add address field',
    actions: [{ type: 'add_field', params: { fieldName: 'address', x: 300, y: 360, fontSize: 12, color: '#555555' }, description: 'Add address field' }]
  },
  {
    id: 'add_phone_field',
    label: 'Phone Field',
    icon: '📞',
    category: 'text',
    description: 'Add phone number field',
    actions: [{ type: 'add_field', params: { fieldName: 'phone', x: 300, y: 400, fontSize: 14, color: '#555555' }, description: 'Add phone field' }]
  },
  {
    id: 'add_email_field',
    label: 'Email Field',
    icon: '✉️',
    category: 'text',
    description: 'Add email field',
    actions: [{ type: 'add_field', params: { fieldName: 'email', x: 300, y: 430, fontSize: 13, color: '#555555' }, description: 'Add email field' }]
  },
  {
    id: 'add_employee_id',
    label: 'Employee ID',
    icon: '🆔',
    category: 'text',
    description: 'Add employee ID field',
    actions: [{ type: 'add_field', params: { fieldName: 'emp_id', x: 300, y: 250, fontSize: 16, color: '#1a1a1a' }, description: 'Add employee ID field' }]
  },
  {
    id: 'add_designation',
    label: 'Designation',
    icon: '💼',
    category: 'text',
    description: 'Add designation/position field',
    actions: [{ type: 'add_field', params: { fieldName: 'designation', x: 300, y: 290, fontSize: 14, color: '#555555' }, description: 'Add designation field' }]
  },
  {
    id: 'add_department',
    label: 'Department',
    icon: '🏢',
    category: 'text',
    description: 'Add department field',
    actions: [{ type: 'add_field', params: { fieldName: 'department', x: 300, y: 330, fontSize: 14, color: '#555555' }, description: 'Add department field' }]
  },
  {
    id: 'add_blood_group',
    label: 'Blood Group',
    icon: '🩸',
    category: 'text',
    description: 'Add blood group field',
    actions: [{ type: 'add_field', params: { fieldName: 'blood_group', x: 300, y: 370, fontSize: 14, color: '#cc0000' }, description: 'Add blood group field' }]
  },

  // ═══════════════════════════════════════
  // SHAPES
  // ═══════════════════════════════════════
  {
    id: 'add_photo_placeholder',
    label: 'Photo Frame',
    icon: '🖼️',
    category: 'shapes',
    description: 'Add photo placeholder area',
    actions: [{ type: 'add_image_placeholder', params: { x: 50, y: 150, width: 200, height: 240, label: 'Photo' }, description: 'Add photo placeholder' }]
  },
  {
    id: 'add_rect_blue',
    label: 'Blue Rectangle',
    icon: '🟦',
    category: 'shapes',
    description: 'Add a blue rectangle',
    actions: [{ type: 'add_rect', params: { x: 100, y: 100, width: 300, height: 80, fill: '#1e3a5f', stroke: '', rx: 8 }, description: 'Add blue rectangle' }]
  },
  {
    id: 'add_rect_header',
    label: 'Header Bar',
    icon: '📊',
    category: 'shapes',
    description: 'Add a full-width header bar',
    actions: [{ type: 'add_rect', params: { x: 0, y: 0, width: 800, height: 80, fill: '#1e3a5f', stroke: '' }, description: 'Add header bar' }]
  },
  {
    id: 'add_rect_footer',
    label: 'Footer Bar',
    icon: '📊',
    category: 'shapes',
    description: 'Add a full-width footer bar',
    actions: [{ type: 'add_rect', params: { x: 0, y: 520, width: 800, height: 80, fill: '#1e3a5f', stroke: '' }, description: 'Add footer bar' }]
  },
  {
    id: 'add_divider',
    label: 'Divider Line',
    icon: '➖',
    category: 'shapes',
    description: 'Add a horizontal divider',
    actions: [{ type: 'add_rect', params: { x: 50, y: 300, width: 700, height: 2, fill: '#cccccc', stroke: '' }, description: 'Add divider line' }]
  },
  {
    id: 'add_circle_avatar',
    label: 'Circle Avatar',
    icon: '⭕',
    category: 'shapes',
    description: 'Add a circle for avatar/logo',
    actions: [{ type: 'add_circle', params: { x: 120, y: 200, radius: 60, fill: '#e0e0e0', stroke: '#1e3a5f' }, description: 'Add circle avatar' }]
  },
  {
    id: 'add_card_border',
    label: 'Card Border',
    icon: '🔲',
    category: 'shapes',
    description: 'Add a thin border rectangle',
    actions: [{ type: 'add_rect', params: { x: 10, y: 10, width: 780, height: 580, fill: 'transparent', stroke: '#1e3a5f', strokeWidth: 3, rx: 12 }, description: 'Add card border' }]
  },
  {
    id: 'add_badge',
    label: 'Badge / Chip',
    icon: '🏷️',
    category: 'shapes',
    description: 'Add a small rounded badge',
    actions: [{ type: 'add_rect', params: { x: 300, y: 500, width: 120, height: 30, fill: '#e53935', stroke: '', rx: 15 }, description: 'Add badge' }]
  },

  // ═══════════════════════════════════════
  // LAYOUT & ALIGNMENT
  // ═══════════════════════════════════════
  {
    id: 'align_center',
    label: 'Center Object',
    icon: '⊕',
    category: 'layout',
    description: 'Center selected object on canvas',
    actions: [{ type: 'align', params: { mode: 'center' }, description: 'Center object' }]
  },
  {
    id: 'align_center_h',
    label: 'Center Horizontal',
    icon: '↔️',
    category: 'layout',
    description: 'Center horizontally',
    actions: [{ type: 'align', params: { mode: 'centerX' }, description: 'Center horizontal' }]
  },
  {
    id: 'align_center_v',
    label: 'Center Vertical',
    icon: '↕️',
    category: 'layout',
    description: 'Center vertically',
    actions: [{ type: 'align', params: { mode: 'centerY' }, description: 'Center vertical' }]
  },
  {
    id: 'align_left',
    label: 'Align Left',
    icon: '⬅️',
    category: 'layout',
    description: 'Align to left edge',
    actions: [{ type: 'align', params: { mode: 'left' }, description: 'Align left' }]
  },
  {
    id: 'align_right',
    label: 'Align Right',
    icon: '➡️',
    category: 'layout',
    description: 'Align to right edge',
    actions: [{ type: 'align', params: { mode: 'right' }, description: 'Align right' }]
  },
  {
    id: 'align_top',
    label: 'Align Top',
    icon: '⬆️',
    category: 'layout',
    description: 'Align to top edge',
    actions: [{ type: 'align', params: { mode: 'top' }, description: 'Align top' }]
  },
  {
    id: 'align_bottom',
    label: 'Align Bottom',
    icon: '⬇️',
    category: 'layout',
    description: 'Align to bottom edge',
    actions: [{ type: 'align', params: { mode: 'bottom' }, description: 'Align bottom' }]
  },
  {
    id: 'bring_front',
    label: 'Bring to Front',
    icon: '🔝',
    category: 'layout',
    description: 'Bring selected object to front',
    actions: [{ type: 'bring_to_front', params: {}, description: 'Bring to front' }]
  },
  {
    id: 'send_back',
    label: 'Send to Back',
    icon: '🔙',
    category: 'layout',
    description: 'Send selected object to back',
    actions: [{ type: 'send_to_back', params: {}, description: 'Send to back' }]
  },
  {
    id: 'duplicate_obj',
    label: 'Duplicate',
    icon: '📋',
    category: 'layout',
    description: 'Duplicate selected object',
    actions: [{ type: 'duplicate', params: { offsetX: 20, offsetY: 20 }, description: 'Duplicate selected' }]
  },
  {
    id: 'delete_selected',
    label: 'Delete Selected',
    icon: '🗑️',
    category: 'layout',
    description: 'Delete selected object',
    actions: [{ type: 'delete_selected', params: {}, description: 'Delete selected' }]
  },
  {
    id: 'group_objects',
    label: 'Group Selected',
    icon: '🔗',
    category: 'layout',
    description: 'Group selected objects',
    actions: [{ type: 'group', params: {}, description: 'Group objects' }]
  },

  // ═══════════════════════════════════════
  // STYLE & APPEARANCE
  // ═══════════════════════════════════════
  {
    id: 'color_red',
    label: 'Red Fill',
    icon: '🔴',
    category: 'style',
    description: 'Change fill to red',
    actions: [{ type: 'change_color', params: { color: '#e53935' }, description: 'Set red fill' }]
  },
  {
    id: 'color_blue',
    label: 'Blue Fill',
    icon: '🔵',
    category: 'style',
    description: 'Change fill to blue',
    actions: [{ type: 'change_color', params: { color: '#1e88e5' }, description: 'Set blue fill' }]
  },
  {
    id: 'color_green',
    label: 'Green Fill',
    icon: '🟢',
    category: 'style',
    description: 'Change fill to green',
    actions: [{ type: 'change_color', params: { color: '#43a047' }, description: 'Set green fill' }]
  },
  {
    id: 'color_black',
    label: 'Black Fill',
    icon: '⚫',
    category: 'style',
    description: 'Change fill to black',
    actions: [{ type: 'change_color', params: { color: '#1a1a1a' }, description: 'Set black fill' }]
  },
  {
    id: 'color_white',
    label: 'White Fill',
    icon: '⚪',
    category: 'style',
    description: 'Change fill to white',
    actions: [{ type: 'change_color', params: { color: '#ffffff' }, description: 'Set white fill' }]
  },
  {
    id: 'color_gold',
    label: 'Gold Fill',
    icon: '🟡',
    category: 'style',
    description: 'Change fill to gold',
    actions: [{ type: 'change_color', params: { color: '#ffc107' }, description: 'Set gold fill' }]
  },
  {
    id: 'opacity_50',
    label: '50% Opacity',
    icon: '🔅',
    category: 'style',
    description: 'Set 50% transparency',
    actions: [{ type: 'set_opacity', params: { opacity: 0.5 }, description: 'Set 50% opacity' }]
  },
  {
    id: 'opacity_100',
    label: 'Full Opacity',
    icon: '🔆',
    category: 'style',
    description: 'Reset to fully opaque',
    actions: [{ type: 'set_opacity', params: { opacity: 1 }, description: 'Full opacity' }]
  },
  {
    id: 'stroke_black',
    label: 'Black Border',
    icon: '🔳',
    category: 'style',
    description: 'Add black border (2px)',
    actions: [{ type: 'set_stroke', params: { color: '#000000', width: 2 }, description: 'Add black border' }]
  },
  {
    id: 'stroke_blue',
    label: 'Blue Border',
    icon: '🔲',
    category: 'style',
    description: 'Add blue border (2px)',
    actions: [{ type: 'set_stroke', params: { color: '#1e88e5', width: 2 }, description: 'Add blue border' }]
  },
  {
    id: 'lock_object',
    label: 'Lock Object',
    icon: '🔒',
    category: 'style',
    description: 'Lock selected object',
    actions: [{ type: 'lock', params: {}, description: 'Lock object' }]
  },
  {
    id: 'unlock_all',
    label: 'Unlock All',
    icon: '🔓',
    category: 'style',
    description: 'Unlock all objects',
    actions: [{ type: 'unlock', params: {}, description: 'Unlock all' }]
  },

  // ═══════════════════════════════════════
  // TRANSFORM (Move)
  // ═══════════════════════════════════════
  {
    id: 'move_up_10',
    label: 'Move Up 10px',
    icon: '⬆️',
    category: 'transform',
    description: 'Move selected up 10px',
    actions: [{ type: 'move_object', params: { x: 0, y: -10, relative: true }, description: 'Move up 10px' }]
  },
  {
    id: 'move_down_10',
    label: 'Move Down 10px',
    icon: '⬇️',
    category: 'transform',
    description: 'Move selected down 10px',
    actions: [{ type: 'move_object', params: { x: 0, y: 10, relative: true }, description: 'Move down 10px' }]
  },
  {
    id: 'move_left_10',
    label: 'Move Left 10px',
    icon: '⬅️',
    category: 'transform',
    description: 'Move selected left 10px',
    actions: [{ type: 'move_object', params: { x: -10, y: 0, relative: true }, description: 'Move left 10px' }]
  },
  {
    id: 'move_right_10',
    label: 'Move Right 10px',
    icon: '➡️',
    category: 'transform',
    description: 'Move selected right 10px',
    actions: [{ type: 'move_object', params: { x: 10, y: 0, relative: true }, description: 'Move right 10px' }]
  },
  {
    id: 'font_arial',
    label: 'Font: Arial',
    icon: 'A',
    category: 'transform',
    description: 'Change font to Arial',
    actions: [{ type: 'change_font', params: { fontFamily: 'Arial' }, description: 'Set Arial font' }]
  },
  {
    id: 'font_times',
    label: 'Font: Times',
    icon: 'T',
    category: 'transform',
    description: 'Change font to Times New Roman',
    actions: [{ type: 'change_font', params: { fontFamily: 'Times New Roman' }, description: 'Set Times font' }]
  },
  {
    id: 'font_size_12',
    label: 'Size: 12px',
    icon: '🔤',
    category: 'transform',
    description: 'Set font size 12',
    actions: [{ type: 'change_size', params: { fontSize: 12 }, description: 'Font size 12' }]
  },
  {
    id: 'font_size_24',
    label: 'Size: 24px',
    icon: '🔤',
    category: 'transform',
    description: 'Set font size 24',
    actions: [{ type: 'change_size', params: { fontSize: 24 }, description: 'Font size 24' }]
  },
  {
    id: 'font_size_36',
    label: 'Size: 36px',
    icon: '🔤',
    category: 'transform',
    description: 'Set font size 36',
    actions: [{ type: 'change_size', params: { fontSize: 36 }, description: 'Font size 36' }]
  },
  {
    id: 'font_size_48',
    label: 'Size: 48px',
    icon: '🔤',
    category: 'transform',
    description: 'Set font size 48',
    actions: [{ type: 'change_size', params: { fontSize: 48 }, description: 'Font size 48' }]
  },
];

export const TASK_CATEGORIES = [
  { id: 'canvas' as const, label: 'Canvas', icon: '🖥️' },
  { id: 'text' as const, label: 'Text & Fields', icon: '📝' },
  { id: 'shapes' as const, label: 'Shapes', icon: '🔷' },
  { id: 'layout' as const, label: 'Layout', icon: '📐' },
  { id: 'style' as const, label: 'Style', icon: '🎨' },
  { id: 'transform' as const, label: 'Transform', icon: '🔄' },
];
