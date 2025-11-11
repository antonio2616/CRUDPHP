<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
require_once __DIR__ . '/../db/conn.php';

$raw = file_get_contents('php://input');
$body = json_decode($raw ?: "{}", true) ?: [];
$op   = $body['op'] ?? 'CONSULTAS_ASC';

try {
  switch ($op) {
    case 'ALTAS':
      $stmt = $pdo->prepare("CALL ALTAS(?,?,?,?,?,?,?,?,?)");
      $stmt->execute([
        $body['nombre'] ?? '',
        $body['apellido_p'] ?? '',
        $body['apellido_m'] ?? '',
        $body['curp'] ?? '', 
        $body['nacimiento'] ?? '',
        $body['genero'] ?? 'Indef.',
        $body['login'] ?? '',
        password_hash($body['pwd'] ?? '', PASSWORD_DEFAULT),
        $body['foto_base64'] ?? null
      ]);
      echo json_encode(['ok'=>1]);
      break;

    case 'BAJAS':
      $stmt = $pdo->prepare("CALL BAJAS(?)");
      $stmt->execute([$body['id'] ?? 0]);
      echo json_encode(['ok'=>1]);
      break;

    case 'CAMBIOS':
      $stmt = $pdo->prepare("CALL CAMBIOS(?,?,?,?,?,?,?,?,?,?)");
      $stmt->execute([
        $body['id'] ?? 0,
        $body['nombre'] ?? '',
        $body['apellido_p'] ?? '',
        $body['apellido_m'] ?? '',
        $body['curp'] ?? '', 
        $body['nacimiento'] ?? '',
        $body['genero'] ?? 'Indef.',
        $body['login'] ?? '',
        $body['pwd'] ? password_hash($body['pwd'], PASSWORD_DEFAULT) : null,
        $body['foto_base64'] ?? null
      ]);
      echo json_encode(['ok'=>1]);
      break;

    case 'CONSULTAS_ASC':
      $res = $pdo->query("SELECT u.*, f.base64 AS foto_base64 FROM usuarios u LEFT JOIN fotos f ON f.usuario_id=u.id ORDER BY u.nombre ASC");
      echo json_encode(['ok'=>1,'data'=>$res->fetchAll()]);
      break;

    case 'CONSULTAS_DESC':
      $res = $pdo->query("SELECT u.*, f.base64 AS foto_base64 FROM usuarios u LEFT JOIN fotos f ON f.usuario_id=u.id ORDER BY u.nombre DESC");
      echo json_encode(['ok'=>1,'data'=>$res->fetchAll()]);
      break;

    case 'CONSULTAS_LOGIN':
      $stmt = $pdo->prepare("SELECT id, login FROM usuarios WHERE login=?");
      $stmt->execute([$body['login'] ?? '']);
      echo json_encode(['ok'=>1,'data'=>$stmt->fetchAll()]);
      break;

    case 'LOGIN':
      $stmt = $pdo->prepare("SELECT id, pwd_hash FROM usuarios WHERE login=?");
      $stmt->execute([$body['login'] ?? '']);
      $u = $stmt->fetch();
      echo json_encode(['ok'=> ($u && password_verify($body['pwd'] ?? '', $u['pwd_hash'])) ? 1 : 0]);
      break;

    default:
      echo json_encode(['ok'=>0,'error'=>'OP_NO_SOPORTADA']);
  }
} catch (Exception $e) {
  echo json_encode(['ok'=>0,'error'=>$e->getMessage()]);
}
