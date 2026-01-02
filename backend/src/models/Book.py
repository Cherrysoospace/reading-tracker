class Book:
    def __init__(self, id, title, author, start_date, end_date, status):
        self.__id= id
        self.__title = title
        self.__author = author
        self.__start_date = start_date
        self.__end_date = end_date
        self.__status = status

#getters
    def get_id(self):
        return self.__id
    
    def get_title(self):
        return self.__title

    def get_author(self):
        return self.__author
    
    def get_start_date(self):
        return self.__start_date
    
    def get_end_date(self):
        return self.__end_date
    
    def get_status(self):
        return self.__status


#setters
    def set_id(self, id):
        self.__id = id
    
    def set_title(self, title):
        self.__title = title
    
    def set_author(self, author):
        self.__author = author
    
    def set_start_date(self, start_date):
        self.__start_date = start_date
    
    def set_end_date(self, end_date):
        self.__end_date = end_date
    
    def set_status(self, status):
        self.__status = status


#Create method mark as finished
    def mark_as_finished(self, end_date):
        self.__end_date = end_date
        self.__status = 'finished'

#Create method to_dict
    def to_dict(self):
        return {
            'id': self.__id,
            'title': self.__title,
            'author': self.__author,
            'start_date': self.__start_date,
            'end_date': self.__end_date,
            'status': self.__status
        }