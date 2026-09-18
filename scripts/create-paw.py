"""Reproducible Blender source for the single LP paw asset. Run with Blender -b -P."""
import bpy, math, os
from mathutils import Vector

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(root, 'public', 'models')
os.makedirs(out, exist_ok=True)
os.makedirs(os.path.join(root, 'assets'), exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, color):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = 0.9
    return mat

cream = material('warm oat — shared cream palette', (0.74, 0.57, 0.38))
pink = material('soft terracotta — shared accent palette', (0.52, 0.23, 0.15))
def ellipsoid(name, location, scale, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, location=location)
    obj=bpy.context.object
    obj.name=name
    obj.scale=scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    for p in obj.data.polygons: p.use_smooth=True
    return obj

body = [ellipsoid('foreleg', (0,0,-0.9), (.64,.56,1.7), cream),
        ellipsoid('palm', (0,0,.52), (.99,.58,.88), cream)]
toes=[(-.78,1.08,-.28),(-.29,1.52,-.10),(.29,1.52,.10),(.78,1.08,.28)]
for i,(x,z,rotation) in enumerate(toes):
    ob=ellipsoid('toe %d'%i,(x,0,z),(.36,.50,.48),cream)
    ob.rotation_euler[1]=rotation
    body.append(ob)
bpy.ops.object.select_all(action='DESELECT')
for ob in body: ob.select_set(True)
bpy.context.view_layer.objects.active=body[0]
bpy.ops.object.join()
paw=bpy.context.object
paw.name='Nekonote — one helping paw'
rem=paw.modifiers.new('organic connected silhouette','REMESH')
rem.mode='VOXEL'
rem.voxel_size=.058
bpy.ops.object.modifier_apply(modifier=rem.name)
smooth=paw.modifiers.new('soft clay','SMOOTH');smooth.factor=1.4;smooth.iterations=7
bpy.ops.object.modifier_apply(modifier=smooth.name)
for p in paw.data.polygons:p.use_smooth=True

# The central pad and four toe beans all belong to the single paw model.
ellipsoid('central heart pad', (0,-.54,.48),(.48,.16,.39),pink)
ellipsoid('pad left lobe',(-.25,-.54,.28),(.30,.16,.24),pink)
ellipsoid('pad right lobe',(.25,-.54,.28),(.30,.16,.24),pink)
for i,(x,z,rotation) in enumerate(toes):
    ob=ellipsoid('toe bean %d'%i,(x,-.45,z),(.21,.14,.28),pink)
    ob.rotation_euler[1]=rotation

meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
triangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes)
assert triangles<100000, triangles
bpy.ops.object.select_all(action='DESELECT')
for ob in meshes: ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(out,'paw.glb'),export_format='GLB',use_selection=True,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,export_yup=True)

scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=32
scene.cycles.use_denoising=True
scene.render.resolution_x=900
scene.render.resolution_y=1000
scene.render.resolution_percentage=100
scene.render.film_transparent=True
scene.world.color=(.7,.7,.7)
def light(name,loc,power,size):
    bpy.ops.object.light_add(type='AREA', location=loc)
    l=bpy.context.object;l.name=name;l.data.energy=power;l.data.shape='DISK';l.data.size=size
    l.rotation_euler=(Vector((0,0,.3))-l.location).to_track_quat('-Z','Y').to_euler()
light('large window',(-3,-4,6),500,5)
light('soft fill',(4,-2,2),250,4)
light('rim',(-1,3,4),400,3)
bpy.ops.object.camera_add(location=(2.6,-7,2.2))
camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,-.1))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=5.7
scene.camera=camera
scene.render.image_settings.file_format='PNG'
scene.render.filepath=os.path.join(out,'paw.png')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(root,'assets','nekonote-paw.blend'))
bpy.ops.render.render(write_still=True)
print('NEKONOTE_PAW_TRIANGLES',triangles)
