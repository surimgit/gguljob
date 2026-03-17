import pymysql

conn = pymysql.connect(
    host='127.0.0.1',
    port=3307,
    user='gguljob_dev_user',
    password='ggulggule107$8991237!',
    database='gguljob_dev'
)
cursor = conn.cursor()
cursor.execute('DESC projects')
columns = [row[0] for row in cursor.fetchall()]
print("COLUMNS:", columns)
conn.close()
