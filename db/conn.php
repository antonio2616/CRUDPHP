<?php
$DB_HOST = '127.0.0.1';
$DB_NAME = 'demo_usuarios';
$DB_USER = 'root';
$DB_PASS = '';

$options = [
  PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
];

try {
  $pdo = new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4", $DB_USER, $DB_PASS, $options);
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode(['ok' => 0, 'error' => 'DB_CONN', 'detalle' => $e->getMessage()]);
  exit;
}
