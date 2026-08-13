insert into public.smae_groups (code, group_name, subgroup, protein_per_equivalent, fat_per_equivalent, carbs_per_equivalent) values
('vegetables','Verduras',null,2,0,4),
('fruits','Frutas',null,0,0,15),
('cereals-no-fat','Cereales y tubérculos','Sin grasa',2,0,15),
('cereals-with-fat','Cereales y tubérculos','Con grasa',2,5,15),
('legumes','Leguminosas',null,8,1,20),
('animal-very-low-fat','Alimentos de origen animal','Muy bajo aporte en grasa',7,1,0),
('animal-low-fat','Alimentos de origen animal','Bajo aporte en grasa',7,3,0),
('animal-moderate-fat','Alimentos de origen animal','Moderado aporte en grasa',7,5,0),
('animal-high-fat','Alimentos de origen animal','Alto aporte en grasa',7,8,0),
('milk-skim','Leche','Descremada',9,2,12),
('milk-semi','Leche','Semidescremada',9,4,12),
('milk-whole','Leche','Entera',9,8,12),
('milk-sugar','Leche','Con azúcar',8,5,30),
('fats-no-protein','Aceites y grasas','Sin proteína',0,5,0),
('fats-with-protein','Aceites y grasas','Con proteína',3,5,3),
('sugars-no-fat','Azúcares','Sin grasa',0,0,10),
('sugars-with-fat','Azúcares','Con grasa',0,5,10),
('free-energy','Libres en energía',null,0,0,0)
on conflict (code) do update set protein_per_equivalent=excluded.protein_per_equivalent, fat_per_equivalent=excluded.fat_per_equivalent, carbs_per_equivalent=excluded.carbs_per_equivalent;

-- Los perfiles, planes y registros requieren UUID de auth.users y se crean desde
-- el flujo autenticado. El modo local incluye el plan demostrativo completo.
